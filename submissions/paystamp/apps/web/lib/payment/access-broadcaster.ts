/**
 * Access Status Broadcaster
 * Broadcasts access status changes to all listening components
 */

type AccessUpdateCallback = (serviceId: string, hasAccess: boolean) => void;

class AccessBroadcaster {
  private listeners: Set<AccessUpdateCallback> = new Set();

  /**
   * Subscribe to access updates
   */
  subscribe(callback: AccessUpdateCallback): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Broadcast access update
   */
  broadcast(serviceId: string, hasAccess: boolean): void {
    this.listeners.forEach((callback) => {
      try {
        callback(serviceId, hasAccess);
      } catch (error) {
        console.error('Error in access update callback:', error);
      }
    });
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Singleton instance
export const accessBroadcaster = new AccessBroadcaster();

