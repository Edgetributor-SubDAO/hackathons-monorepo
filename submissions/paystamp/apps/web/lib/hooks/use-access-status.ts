/**
 * React hook for managing access status with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWalletStore } from '@/stores/wallet-store';
import { AccessManager, ServiceAccessStatus, AllAccessStatus } from '../payment/access-manager';
import { accessBroadcaster } from '../payment/access-broadcaster';

export function useAccessStatus(serviceId?: string) {
  const { stellarAddress, stellarNetwork } = useWalletStore();
  const [accessStatus, setAccessStatus] = useState<ServiceAccessStatus | null>(null);
  const [allAccessStatus, setAllAccessStatus] = useState<AllAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const accessManagerRef = useRef<AccessManager | null>(null);
  const isPollingRef = useRef(false);

  // Initialize access manager
  useEffect(() => {
    if (!accessManagerRef.current) {
      accessManagerRef.current = new AccessManager(stellarNetwork, 'shibuya');
    }
  }, [stellarNetwork]);

  // Get single service access
  const getServiceAccess = useCallback(async () => {
    if (!stellarAddress || !serviceId || !accessManagerRef.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const status = await accessManagerRef.current.getServiceAccess(
        stellarAddress,
        serviceId
      );
      setAccessStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch access status');
      console.error('Error fetching access status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [stellarAddress, serviceId]);

  // Get all services access
  const getAllAccess = useCallback(async () => {
    if (!stellarAddress || !accessManagerRef.current) {
      setIsLoading(false);
      return;
    }

    // Don't set loading if we already have cached data
    const hasCachedData = !!allAccessStatus;
    if (!hasCachedData) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Add timeout to prevent infinite loading (reduced to 15 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
      });

      const statusPromise = accessManagerRef.current.getAllAccessStatus(stellarAddress);
      const status = await Promise.race([statusPromise, timeoutPromise]);
      
      setAllAccessStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch access status');
      console.error('Error fetching all access status:', err);
      // Set empty status on error so UI can still render
      if (!allAccessStatus) {
        setAllAccessStatus({
          services: [],
          lastUpdated: Date.now(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [stellarAddress, allAccessStatus]);

  // Start polling for a service
  const startPolling = useCallback(() => {
    if (!stellarAddress || !serviceId || !accessManagerRef.current || isPollingRef.current) {
      return;
    }

    isPollingRef.current = true;

    accessManagerRef.current.startPolling(
      stellarAddress,
      serviceId,
      (status) => {
        setAccessStatus(status);
        setIsLoading(false);
      },
      5000 // Poll every 5 seconds
    );
  }, [stellarAddress, serviceId]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (!stellarAddress || !serviceId || !accessManagerRef.current) {
      return;
    }

    accessManagerRef.current.stopPolling(stellarAddress, serviceId);
    isPollingRef.current = false;
  }, [stellarAddress, serviceId]);

  // Refresh access status
  const refresh = useCallback(async () => {
    if (!accessManagerRef.current || !stellarAddress) return;

    // Invalidate cache
    if (serviceId) {
      accessManagerRef.current.invalidateCache(stellarAddress, serviceId);
      await getServiceAccess();
    } else {
      accessManagerRef.current.invalidateAllCache();
      await getAllAccess();
    }
  }, [stellarAddress, serviceId, getServiceAccess, getAllAccess]);

  // Initial fetch
  useEffect(() => {
    if (!stellarAddress || !accessManagerRef.current) {
      setIsLoading(false);
      return;
    }

    if (serviceId) {
      getServiceAccess();
    } else {
      getAllAccess();
    }
  }, [stellarAddress, serviceId, getServiceAccess, getAllAccess]);

  // Listen for access updates from broadcaster
  useEffect(() => {
    const unsubscribe = accessBroadcaster.subscribe(async (updatedServiceId, hasAccess) => {
      if (!accessManagerRef.current || !stellarAddress) return;

      if (serviceId) {
        // Single service mode - only update if it matches
        if (updatedServiceId === serviceId) {
          accessManagerRef.current.invalidateCache(stellarAddress, serviceId);
          try {
            const freshStatus = await accessManagerRef.current.getServiceAccess(
              stellarAddress,
              serviceId
            );
            setAccessStatus(freshStatus);
            setIsLoading(false);
          } catch (error) {
            console.error('Error refreshing access after broadcast:', error);
            refresh();
          }
        }
      } else {
        // All services mode - refresh all when any service updates
        accessManagerRef.current.invalidateCache(stellarAddress, updatedServiceId);
        // Refresh all services
        refresh();
      }
    });

    return unsubscribe;
  }, [serviceId, stellarAddress, refresh]);

  // Start polling when access status is available
  useEffect(() => {
    if (serviceId && accessStatus && !isPollingRef.current) {
      startPolling();
    }

    return () => {
      if (serviceId) {
        stopPolling();
      }
    };
  }, [serviceId, accessStatus, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (accessManagerRef.current) {
        accessManagerRef.current.stopAllPolling();
      }
    };
  }, []);

  return {
    accessStatus,
    allAccessStatus,
    isLoading,
    error,
    refresh,
    startPolling,
    stopPolling,
  };
}

