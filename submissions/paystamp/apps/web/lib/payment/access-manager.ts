/**
 * Access Manager
 * Manages access status for all services with real-time updates
 */

import { ServiceHandlerRegistry } from './service-handlers';
import { PaymentService } from './payment-service';
import { accessBroadcaster } from './access-broadcaster';

export interface ServiceAccessStatus {
  serviceId: string;
  serviceName: string;
  hasAccess: boolean;
  expiresAt: number | null;
  nftId: string | null;
  lastChecked: number;
  isExpired: boolean;
}

export interface AllAccessStatus {
  services: ServiceAccessStatus[];
  lastUpdated: number;
}

export class AccessManager {
  private serviceHandler: ServiceHandlerRegistry;
  private paymentService: PaymentService;
  private updateCallbacks: Map<string, (status: ServiceAccessStatus) => void> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cache: Map<string, ServiceAccessStatus> = new Map();

  constructor(stellarNetwork: 'testnet' | 'mainnet', polkadotNetwork: 'shibuya' | 'shiden' | 'astar') {
    this.serviceHandler = new ServiceHandlerRegistry();
    this.paymentService = new PaymentService(stellarNetwork, polkadotNetwork);
  }

  /**
   * Get access status for a specific service
   */
  async getServiceAccess(
    userAddress: string,
    serviceId: string
  ): Promise<ServiceAccessStatus> {
    const cacheKey = `${userAddress}:${serviceId}`;
    const cached = this.cache.get(cacheKey);

    // Return cached if less than 5 seconds old
    if (cached && Date.now() - cached.lastChecked < 5000) {
      return cached;
    }

    try {
      // Add timeout to prevent hanging (5 seconds per service)
      const timeoutPromise = new Promise<ServiceAccessStatus>((_, reject) => {
        setTimeout(() => reject(new Error('Service check timeout')), 5000);
      });

      const accessPromise = (async () => {
        const access = await this.paymentService.checkAccess(userAddress, serviceId);
        const accessStamp = await this.serviceHandler.getHandler(serviceId)?.getAccessDetails(userAddress).catch(() => null);
        
        const now = Date.now() / 1000;
        const expiresAt = access.expiresAt ? access.expiresAt : null;
        const isExpired = expiresAt ? expiresAt < now : true;

        const status: ServiceAccessStatus = {
          serviceId,
          serviceName: this.getServiceName(serviceId),
          hasAccess: access.hasAccess && !isExpired,
          expiresAt,
          nftId: accessStamp?.nftId || null,
          lastChecked: Date.now(),
          isExpired,
        };

        // Update cache
        this.cache.set(cacheKey, status);

        // Notify subscribers
        this.notifySubscribers(serviceId, status);

        // Broadcast update (only if status changed)
        if (!cached || cached.hasAccess !== status.hasAccess) {
          accessBroadcaster.broadcast(serviceId, status.hasAccess);
        }

        return status;
      })();

      return await Promise.race([accessPromise, timeoutPromise]);
    } catch (error) {
      console.error(`Error checking access for ${serviceId}:`, error);
      // Return a default status instead of throwing
      const defaultStatus: ServiceAccessStatus = {
        serviceId,
        serviceName: this.getServiceName(serviceId),
        hasAccess: false,
        expiresAt: null,
        nftId: null,
        lastChecked: Date.now(),
        isExpired: true,
      };
      this.cache.set(cacheKey, defaultStatus);
      return defaultStatus;
    }
  }

  /**
   * Get access status for all services
   */
  async getAllAccessStatus(userAddress: string): Promise<AllAccessStatus> {
    const serviceIds = [
      'analytics',
      'security',
      'performance',
      'global',
      'defi_dashboard',
      'wifi_hotspot',
      'content_access',
      'event_ticket',
      'api_key',
    ];

    // Use Promise.allSettled with individual timeouts to prevent hanging
    const results = await Promise.allSettled(
      serviceIds.map((serviceId) => {
        // Each service check has its own timeout wrapper
        return Promise.race([
          this.getServiceAccess(userAddress, serviceId),
          new Promise<ServiceAccessStatus>((resolve) => {
            setTimeout(() => {
              // Return default status on timeout
              resolve({
                serviceId,
                serviceName: this.getServiceName(serviceId),
                hasAccess: false,
                expiresAt: null,
                nftId: null,
                lastChecked: Date.now(),
                isExpired: true,
              });
            }, 3000); // 3 second timeout per service
          }),
        ]);
      })
    );

    const services = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Return default status for failed services
        console.error(`Failed to get access for ${serviceIds[index]}:`, result.reason);
        return {
          serviceId: serviceIds[index],
          serviceName: this.getServiceName(serviceIds[index]),
          hasAccess: false,
          expiresAt: null,
          nftId: null,
          lastChecked: Date.now(),
          isExpired: true,
        };
      }
    });

    return {
      services,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Start polling for a specific service
   */
  startPolling(
    userAddress: string,
    serviceId: string,
    callback: (status: ServiceAccessStatus) => void,
    interval: number = 5000
  ): void {
    const key = `${userAddress}:${serviceId}`;
    
    // Stop existing polling if any
    this.stopPolling(userAddress, serviceId);

    // Register callback
    this.updateCallbacks.set(key, callback);

    // Initial check
    this.getServiceAccess(userAddress, serviceId).then(callback);

    // Start polling
    const pollInterval = setInterval(async () => {
      const status = await this.getServiceAccess(userAddress, serviceId);
      callback(status);
    }, interval);

    this.pollingIntervals.set(key, pollInterval);
  }

  /**
   * Stop polling for a specific service
   */
  stopPolling(userAddress: string, serviceId: string): void {
    const key = `${userAddress}:${serviceId}`;
    const interval = this.pollingIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
    }
    this.updateCallbacks.delete(key);
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
    this.updateCallbacks.clear();
  }

  /**
   * Invalidate cache for a service (force refresh)
   */
  invalidateCache(userAddress: string, serviceId: string): void {
    const cacheKey = `${userAddress}:${serviceId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Invalidate all cache
   */
  invalidateAllCache(): void {
    this.cache.clear();
  }

  /**
   * Notify subscribers of status change
   */
  private notifySubscribers(serviceId: string, status: ServiceAccessStatus): void {
    this.updateCallbacks.forEach((callback, key) => {
      if (key.endsWith(`:${serviceId}`)) {
        callback(status);
      }
    });
  }

  /**
   * Get service name
   */
  private getServiceName(serviceId: string): string {
    const names: Record<string, string> = {
      analytics: 'Premium Analytics',
      security: 'Security Suite',
      performance: 'Performance Boost',
      global: 'Global Access',
      defi_dashboard: 'Premium DeFi Dashboard',
      wifi_hotspot: 'DePIN WiFi Hotspot',
      content_access: 'Exclusive Content',
      event_ticket: 'Event Ticket',
      api_key: 'Developer API Key',
    };
    return names[serviceId] || serviceId;
  }
}

