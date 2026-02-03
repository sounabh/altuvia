// lib/hooks/useDashboardData.js

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

// ============================================
// CUSTOM FETCHER WITH AUTH
// ============================================
const createFetcher = (token, apiBaseUrl) => async (url) => {
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(`${apiBaseUrl}${url}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    const error = new Error('Authentication failed');
    error.status = 401;
    error.info = await response.json();
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json();
    const error = new Error(errorData.error || 'Failed to fetch data');
    error.status = response.status;
    error.info = errorData;
    throw error;
  }

  return response.json();
};

// ============================================
// CALCULATE STATS FROM UNIVERSITIES DATA
// ============================================
const calculateStats = (uniArray) => {
  if (!uniArray || uniArray.length === 0) {
    return {
      total: 0,
      inProgress: 0,
      submitted: 0,
      notStarted: 0,
      upcomingDeadlines: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalEssays: 0,
      completedEssays: 0,
      inProgressEssays: 0,
      notStartedEssays: 0,
      averageProgress: 0,
      fullyCompletedUniversities: 0,
      universitiesReadyForSubmission: 0
    };
  }

  // Single pass calculation for better performance
  const result = uniArray.reduce((acc, u) => {
    // Count by status
    if (u.status === 'in-progress') acc.inProgress++;
    else if (u.status === 'submitted') acc.submitted++;
    else acc.notStarted++;
    
    // Aggregate numbers
    acc.upcomingDeadlines += u.upcomingDeadlines || 0;
    acc.totalTasks += u.totalTasks || 0;
    acc.completedTasks += u.tasks || 0;
    acc.totalEssays += u.totalEssays || 0;
    acc.completedEssays += u.completedEssays || 0;
    acc.inProgressEssays += u.inProgressEssays || 0;
    acc.notStartedEssays += u.notStartedEssays || 0;
    acc.totalProgress += u.overallProgress || 0;
    
    // Count ready for submission
    if (u.stats?.applicationHealth?.readyForSubmission) {
      acc.universitiesReadyForSubmission++;
    }
    
    return acc;
  }, {
    total: uniArray.length,
    inProgress: 0,
    submitted: 0,
    notStarted: 0,
    upcomingDeadlines: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalEssays: 0,
    completedEssays: 0,
    inProgressEssays: 0,
    notStartedEssays: 0,
    totalProgress: 0,
    universitiesReadyForSubmission: 0
  });

  result.averageProgress = Math.round(result.totalProgress / uniArray.length) || 0;
  result.fullyCompletedUniversities = result.submitted;

  return result;
};

// ============================================
// CUSTOM HOOK FOR DASHBOARD DATA MANAGEMENT
// Optimized version with SWR - NO SESSION STORAGE
// ============================================
export const useDashboardData = () => {
  // ========== AUTHENTICATION & ROUTING ==========
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ========== REFS ==========
  const mountedRef = useRef(true);
  const isHandlingAuthErrorRef = useRef(false);

  // ========== CONSTANTS ==========
  const API_BASE_URL = useMemo(() => 
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000", 
  []);

  // ========== STATE FOR INITIALIZATION TRACKING ==========
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================
  // SWR CONFIGURATION
  // ============================================
  const shouldFetch = status === "authenticated" && !!session?.token;
  
  const { data, error, isValidating, mutate } = useSWR(
    // Only fetch if authenticated
    shouldFetch ? '/api/university/saved' : null,
    // Fetcher with auth token
    shouldFetch ? createFetcher(session.token, API_BASE_URL) : null,
    {
      // Revalidation settings
      revalidateOnFocus: true,        // Refresh when tab gains focus
      revalidateOnReconnect: true,    // Refresh on network reconnect
      revalidateOnMount: true,        // Always fetch fresh data on mount
      revalidateIfStale: true,        // Revalidate if data is stale
      
      // Performance settings
      dedupingInterval: 2000,         // Dedupe requests within 2 seconds
      focusThrottleInterval: 5000,    // Throttle focus revalidation to 5 seconds
      
      // Error handling
      shouldRetryOnError: true,       // Retry on error
      errorRetryCount: 3,             // Max 3 retries
      errorRetryInterval: 1000,       // 1 second between retries
      
      // No auto-refresh interval (only manual/focus/reconnect)
      refreshInterval: 0,
      
      // Optimistic updates
      optimisticData: undefined,
      
      // Callback on success
      onSuccess: (data) => {
        if (mountedRef.current) {
          console.log('✅ SWR data fetched:', data?.universities?.length || 0, 'universities');
          setIsInitialized(true);
        }
      },
      
      // Callback on error
      onError: (err) => {
        if (mountedRef.current) {
          console.error('❌ SWR error:', err);
          setIsInitialized(true);
        }
      },
    }
  );

  // ============================================
  // AUTHENTICATION ERROR HANDLER
  // ============================================
  const handleAuthError = useCallback(async (errorMessage) => {
    // Prevent multiple simultaneous auth error handlers
    if (isHandlingAuthErrorRef.current) return;
    isHandlingAuthErrorRef.current = true;

    console.error("Authentication error:", errorMessage);
    
    const isJWTError = errorMessage?.toLowerCase().includes('jwt') || 
                       errorMessage?.toLowerCase().includes('token') ||
                       errorMessage?.toLowerCase().includes('expired') ||
                       errorMessage?.toLowerCase().includes('invalid');
    
    if (isJWTError) {
      try {
        await signOut({ redirect: false });
        router.push('/onboarding/signup');
      } finally {
        isHandlingAuthErrorRef.current = false;
      }
    } else {
      isHandlingAuthErrorRef.current = false;
    }
  }, [router]);

  // ============================================
  // HANDLE SWR ERRORS (including auth errors)
  // ============================================
  useEffect(() => {
    if (error && mountedRef.current) {
      if (error.status === 401 || 
          error.message?.toLowerCase().includes('jwt') || 
          error.message?.toLowerCase().includes('token')) {
        handleAuthError(error.message || 'Authentication failed');
      }
    }
  }, [error, handleAuthError]);

  // ============================================
  // EXTRACT DATA FROM SWR RESPONSE
  // ============================================
  const universities = useMemo(() => data?.universities || [], [data?.universities]);
  const userProfile = useMemo(() => data?.userProfile || null, [data?.userProfile]);
  const cvSummary = useMemo(() => data?.cvSummary || null, [data?.cvSummary]);
  
  // Use stats from API or calculate if not provided
  const stats = useMemo(() => {
    if (data?.stats) return data.stats;
    return calculateStats(universities);
  }, [data?.stats, universities]);

  // ============================================
  // REMOVE UNIVERSITY WITH OPTIMISTIC UPDATE
  // ============================================
  const handleRemoveUniversity = useCallback(async (universityId) => {
    if (!session?.token) {
      console.error("No authentication token found");
      return;
    }

    try {
      // Optimistic update - immediately update UI
      await mutate(
        async (currentData) => {
          if (!currentData) return currentData;
          
          // Filter out the removed university
          const updatedUniversities = currentData.universities.filter(
            (u) => u.id !== universityId
          );
          
          // Recalculate stats
          const updatedStats = calculateStats(updatedUniversities);
          
          // Return optimistically updated data
          return {
            ...currentData,
            universities: updatedUniversities,
            stats: updatedStats,
            count: updatedUniversities.length
          };
        },
        {
          // Don't revalidate yet - wait for API call to complete
          revalidate: false,
          // Show optimistic update immediately
          optimisticData: (currentData) => {
            if (!currentData) return currentData;
            
            const updatedUniversities = currentData.universities.filter(
              (u) => u.id !== universityId
            );
            const updatedStats = calculateStats(updatedUniversities);
            
            return {
              ...currentData,
              universities: updatedUniversities,
              stats: updatedStats,
              count: updatedUniversities.length
            };
          },
          // Rollback on error
          rollbackOnError: true,
        }
      );

      // Make the actual API call
      const response = await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ universityId }),
      });

      if (response.status === 401) {
        const errorData = await response.json();
        await handleAuthError(errorData.error || 'Authentication failed');
        // Revalidate to get fresh data
        await mutate();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove university');
      }

      // Success - revalidate to ensure consistency
      await mutate();
      
      console.log('✅ University removed successfully');
      
    } catch (err) {
      console.error('❌ Error removing university:', err);
      
      // Revalidate to restore correct state
      await mutate();
      
      if (err.message?.toLowerCase().includes('jwt') || 
          err.message?.toLowerCase().includes('token')) {
        await handleAuthError(err.message);
      }
    }
  }, [session?.token, handleAuthError, API_BASE_URL, mutate]);

  // ============================================
  // MANUAL REFETCH FUNCTION
  // ============================================
  const refetch = useCallback(async () => {
    console.log('🔄 Manual refetch triggered');
    try {
      await mutate();
    } catch (err) {
      console.error('Error refetching data:', err);
    }
  }, [mutate]);

  // ============================================
  // REDIRECT UNAUTHENTICATED USERS
  // ============================================
  useEffect(() => {
    if (status !== "loading" && status !== "authenticated") {
      router.push('/onboarding/signup');
    }
  }, [status, router]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      isHandlingAuthErrorRef.current = false;
    };
  }, []);

  // ============================================
  // LOADING STATE
  // ============================================
  // Loading is true when:
  // 1. No data yet AND no error AND currently validating
  // 2. OR not initialized yet AND validating
  const loading = (!data && !error && isValidating) || (!isInitialized && isValidating);

  // ============================================
  // ERROR STATE
  // ============================================
  const errorMessage = error ? (error.message || 'Failed to load dashboard data') : null;

  // ============================================
  // RETURN HOOK VALUES
  // ============================================
  return {
    // Data
    universities,
    userProfile,
    cvSummary,
    stats,
    
    // Status
    loading,
    error: errorMessage,
    isInitialized,
    isValidating, // Expose for background refresh indicators
    
    // Actions
    handleRemoveUniversity,
    refetch,
    mutate, // Expose for advanced use cases
  };
};

export default useDashboardData;