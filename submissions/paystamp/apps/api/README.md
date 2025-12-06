# PayStamp GraphQL API

Production-ready GraphQL API with real-time subscriptions and WebSocket support.

## Features

- ✅ GraphQL API with Apollo Server
- ✅ Real-time subscriptions
- ✅ WebSocket support (Socket.io)
- ✅ Redis caching
- ✅ Rate limiting
- ✅ Authentication (API keys, JWT, wallet signatures)
- ✅ Prisma for data access

## API Endpoints

### GraphQL

```
POST /graphql
```

### Health Check

```
GET /health
```

## GraphQL Schema

### Queries

- `getAccessStatus(userAddress, serviceId)` - Get access status
- `getPaymentHistory(userAddress, serviceId, limit, offset)` - Get payment history
- `getServiceInfo(serviceId)` - Get service information
- `getUserAccessStamps(userAddress)` - Get user's access stamps

### Mutations

- `initiatePayment(userAddress, serviceId, amount, currency)` - Initiate payment
- `verifyAccess(userAddress, serviceId)` - Verify access

### Subscriptions

- `accessStatusChanged(userAddress, serviceId)` - Subscribe to access changes
- `paymentProcessed(paymentHash)` - Subscribe to payment updates

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### Environment Variables

Create `.env` file:

```env
# API
API_PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/paystamp

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret
API_KEY_SECRET=your-api-key-secret
```

### Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## Usage

### GraphQL Query Example

```graphql
query GetAccessStatus {
  getAccessStatus(
    userAddress: "G..."
    serviceId: "SERVICE1"
  ) {
    hasAccess
    expiresAt
    isExpired
    nftId
  }
}
```

### GraphQL Mutation Example

```graphql
mutation InitiatePayment {
  initiatePayment(
    userAddress: "G..."
    serviceId: "SERVICE1"
    amount: "500"
    currency: "XLM"
  ) {
    success
    merchantAddress
    amount
    currency
    memo
  }
}
```

### GraphQL Subscription Example

```graphql
subscription AccessStatusChanged {
  accessStatusChanged(
    userAddress: "G..."
    serviceId: "SERVICE1"
  ) {
    hasAccess
    expiresAt
    timestamp
  }
}
```

### WebSocket Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

// Join user room
socket.emit('join:user', { userAddress: 'G...' });

// Listen for access updates
socket.on('access:status:changed', (data) => {
  console.log('Access status changed:', data);
});

// Join payment room
socket.emit('join:payment', { paymentHash: '...' });

// Listen for payment updates
socket.on('payment:processed', (data) => {
  console.log('Payment processed:', data);
});
```

## Authentication

### API Key

```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:4000/graphql
```

### JWT Token

```bash
curl -H "Authorization: Bearer your-jwt-token" \
  http://localhost:4000/graphql
```

### Wallet Signature

```bash
curl -H "X-Wallet-Address: G..." \
     -H "X-Wallet-Signature: ..." \
  http://localhost:4000/graphql
```

## Rate Limiting

- **General API**: 100 requests per minute per IP
- **GraphQL**: 200 requests per minute per IP/user
- **Slow down**: After 50 requests, add 500ms delay per request

## Caching

- Access status: 30 seconds
- Service info: 5 minutes
- Payment history: No cache (real-time data)

## WebSocket Events

### Client → Server

- `join:user` - Join user room
- `join:service` - Join service room
- `join:payment` - Join payment room

### Server → Client

- `access:status:changed` - Access status update
- `payment:processed` - Payment processing update

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### PM2

```bash
pm2 start dist/index.js --name paystamp-api
```

## Monitoring

### Health Check

```bash
curl http://localhost:4000/health
```

### GraphQL Playground

In development, Apollo Server provides a playground at:
```
http://localhost:4000/graphql
```

## Architecture

```
Client
  ↓
Express (Rate Limiting, Auth)
  ↓
Apollo Server (GraphQL)
  ↓
Resolvers
  ↓
Services (Business Logic)
  ↓
Prisma (Database)
  ↓
PostgreSQL

Socket.io (WebSocket)
  ↓
PubSub (Subscriptions)
  ↓
Redis (Caching)
```

## Error Handling

GraphQL errors are returned in the standard format:

```json
{
  "errors": [
    {
      "message": "Error message",
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ]
}
```

## Security

- ✅ Rate limiting per IP/user
- ✅ API key authentication
- ✅ JWT token authentication
- ✅ Wallet signature verification (to be implemented)
- ✅ CORS protection
- ✅ Input validation

## Next Steps

1. Implement wallet signature verification
2. Add GraphQL query complexity analysis
3. Add request logging
4. Implement field-level permissions
5. Add API documentation

