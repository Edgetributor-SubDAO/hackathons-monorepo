// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - WEBSOCKET HUB
//                    Real-time Communication Manager
// ═══════════════════════════════════════════════════════════════════════════

package websocket

import (
	"encoding/json"
	"sync"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

// Client represents a WebSocket client connection
type Client struct {
	ID   string
	Conn *websocket.Conn
	Hub  *Hub
	Send chan []byte
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients
	clients map[string]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast to specific client by ID
	unicast chan *UnicastMessage

	// Broadcast to all clients
	broadcast chan []byte

	// Mutex for thread-safe access
	mu sync.RWMutex

	// Shutdown signal
	shutdown chan struct{}
}

// UnicastMessage is a message for a specific client
type UnicastMessage struct {
	ClientID string
	Message  []byte
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		unicast:    make(chan *UnicastMessage, 256),
		broadcast:  make(chan []byte, 256),
		shutdown:   make(chan struct{}),
	}
}

// Run starts the hub's main event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
			log.Info().Str("clientId", client.ID).Int("total", len(h.clients)).Msg("Client connected")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Info().Str("clientId", client.ID).Int("total", len(h.clients)).Msg("Client disconnected")

		case message := <-h.unicast:
			h.mu.RLock()
			if client, ok := h.clients[message.ClientID]; ok {
				select {
				case client.Send <- message.Message:
				default:
					// Client's buffer is full, disconnect
					h.mu.RUnlock()
					h.unregister <- client
					continue
				}
			}
			h.mu.RUnlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.Send <- message:
				default:
					// Client's buffer is full, mark for disconnection
					go func(c *Client) { h.unregister <- c }(client)
				}
			}
			h.mu.RUnlock()

		case <-h.shutdown:
			h.mu.Lock()
			for id, client := range h.clients {
				close(client.Send)
				delete(h.clients, id)
			}
			h.mu.Unlock()
			return
		}
	}
}

// Shutdown gracefully shuts down the hub
func (h *Hub) Shutdown() {
	close(h.shutdown)
}

// Register adds a new client to the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// SendToClient sends a message to a specific client
func (h *Hub) SendToClient(clientID string, data interface{}) error {
	message, err := json.Marshal(data)
	if err != nil {
		return err
	}
	h.unicast <- &UnicastMessage{
		ClientID: clientID,
		Message:  message,
	}
	return nil
}

// Broadcast sends a message to all clients
func (h *Hub) Broadcast(data interface{}) error {
	message, err := json.Marshal(data)
	if err != nil {
		return err
	}
	h.broadcast <- message
	return nil
}

// NewClient creates a new WebSocket client
func NewClient(conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		ID:   uuid.New().String(),
		Conn: conn,
		Hub:  hub,
		Send: make(chan []byte, 256),
	}
}

// ReadPump handles incoming messages from the client
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister(c)
		c.Conn.Close()
	}()

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Error().Err(err).Str("clientId", c.ID).Msg("WebSocket read error")
			}
			break
		}
		// We don't process incoming messages for now, just keep connection alive
	}
}

// WritePump handles outgoing messages to the client
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for message := range c.Send {
		err := c.Conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Error().Err(err).Str("clientId", c.ID).Msg("WebSocket write error")
			return
		}
	}
}
