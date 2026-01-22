// lib/hooks/useDashboardData.js

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ============================================
// CUSTOM HOOK FOR DASHBOARD DATA MANAGEMENT
// Fixed version - prevents unnecessary refetches & empty state flash
// ============================================

export const useDashboardData = () => {
  // ========== STATE MANAGEMENT ==========
  const [universities, setUniversities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [cvSummary, setCVSummary] = useState(null);
  const [stats, setStats] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ========== KEY STATE: Track initialization ==========
  const [isInitialized, setIsInitialized] = useState(false);

  // ========== REFS FOR PREVENTING DUPLICATE FETCHES ==========
  const isFetchingRef = useRef(false);
  const fetchControllerRef = useRef(null);
  const lastSuccessfulFetchRef = useRef(0);
  const mountedRef = useRef(true);
  const hasAttemptedFetchRef = useRef(false);

  // ========== AUTHENTICATION & ROUTING ==========
  const { data: session, status } = useSession();
  const router = useRouter();

  // ========== CONSTANTS ==========
  const API_BASE_URL = useMemo(() => 
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000", 
  []);
  
  // Cache durations
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - don't refetch within this time
  const STALE_DURATION = 15 * 60 * 1000; // 15 minutes - background refresh threshold

  // ============================================
  // AUTHENTICATION ERROR HANDLER
  // ============================================
  const handleAuthError = useCallback(async (errorMessage) => {
    console.error("Authentication error:", errorMessage);
    
    const isJWTError = errorMessage?.toLowerCase().includes('jwt') || 
                       errorMessage?.toLowerCase().includes('token') ||
                       errorMessage?.toLowerCase().includes('expired') ||
                       errorMessage?.toLowerCase().includes('invalid');
    
    if (isJWTError) {
      await signOut({ redirect: false });
      router.push('/onboarding/signup');
    } else {
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
        setIsInitialized(true); // Mark as initialized even on error
      }
    }
  }, [router]);

  // ============================================
  // CALCULATE STATS FROM UNIVERSITIES DATA
  // ============================================
  const calculateStats = useCallback((uniArray) => {
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

    return {
      total: uniArray.length,
      inProgress: uniArray.filter(u => u.status === 'in-progress').length,
      submitted: uniArray.filter(u => u.status === 'submitted').length,
      notStarted: uniArray.filter(u => u.status === 'not-started').length,
      upcomingDeadlines: uniArray.reduce((sum, u) => sum + (u.upcomingDeadlines || 0), 0),
      totalTasks: uniArray.reduce((sum, u) => sum + (u.totalTasks || 0), 0),
      completedTasks: uniArray.reduce((sum, u) => sum + (u.tasks || 0), 0),
      totalEssays: uniArray.reduce((sum, u) => sum + (u.totalEssays || 0), 0),
      completedEssays: uniArray.reduce((sum, u) => sum + (u.completedEssays || 0), 0),
      inProgressEssays: uniArray.reduce((sum, u) => sum + (u.inProgressEssays || 0), 0),
      notStartedEssays: uniArray.reduce((sum, u) => sum + (u.notStartedEssays || 0), 0),
      averageProgress: Math.round(
        uniArray.reduce((sum, u) => sum + (u.overallProgress || 0), 0) / uniArray.length
      ) || 0,
      fullyCompletedUniversities: uniArray.filter(u => u.status === 'submitted').length,
      universitiesReadyForSubmission: uniArray.filter(u => 
        u.stats?.applicationHealth?.readyForSubmission
      ).length
    };
  }, []);

  // ============================================
  // FETCH SAVED UNIVERSITIES DATA
  // ============================================
  const fetchSavedUniversities = useCallback(async (options = {}) => {
    const { forceRefresh = false, silent = false } = options;

    // ========== GUARD CLAUSES ==========
    
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('⏳ Already fetching, skipping...');
      return;
    }

    // Check cache validity (only if already initialized and not forcing refresh)
    const now = Date.now();
    const timeSinceLastFetch = now - lastSuccessfulFetchRef.current;
    
    if (!forceRefresh && isInitialized && timeSinceLastFetch < CACHE_DURATION) {
      console.log('📦 Using cached data, skipping fetch...');
      return;
    }

    // Wait for session status
    if (status === "loading") {
      console.log('⏳ Session loading, waiting...');
      return;
    }

    // Check authentication
    if (status !== "authenticated" || !session?.token) {
      console.log('🚫 Not authenticated, redirecting...');
      setLoading(false);
      setIsInitialized(true);
      router.push('/onboarding/signup');
      return;
    }

    // ========== START FETCH ==========
    
    // Cancel any existing fetch
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    const controller = new AbortController();
    fetchControllerRef.current = controller;
    isFetchingRef.current = true;
    hasAttemptedFetchRef.current = true;

    try {
      // Set loading state (silent mode doesn't show loading spinner)
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 Fetching saved universities...');

      const response = await fetch(`${API_BASE_URL}/api/university/saved`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      // Check if component is still mounted
      if (!mountedRef.current) return;

      // Handle auth errors
      if (response.status === 401) {
        const errorData = await response.json();
        await handleAuthError(errorData.error || 'Authentication failed');
        return;
      }

      // Process successful response
      if (response.ok) {
        const data = await response.json();
        
        if (!mountedRef.current) return;

        console.log('✅ Data fetched successfully:', data.universities?.length || 0, 'universities');

        // Update all state
        setUniversities(data.universities || []);
        setUserProfile(data.userProfile || null);
        setCVSummary(data.cvSummary || null);
        
        const calculatedStats = calculateStats(data.universities || []);
        setStats(data.stats || calculatedStats);
        
        // Update cache timestamp
        lastSuccessfulFetchRef.current = Date.now();
        
        // ✅ IMPORTANT: Set initialized BEFORE setting loading to false
        setIsInitialized(true);
        setLoading(false);
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch saved universities');
      }
    } catch (err) {
      // Ignore abort errors (expected when cancelling)
      if (err.name === 'AbortError') {
        console.log('🛑 Fetch aborted');
        return;
      }
      
      if (!mountedRef.current) return;

      console.error('❌ Error fetching:', err);
      
      if (err.message?.toLowerCase().includes('jwt') || 
          err.message?.toLowerCase().includes('token')) {
        await handleAuthError(err.message);
      } else {
        setError('Error loading saved universities. Please try again.');
        setLoading(false);
        setIsInitialized(true); // Mark as initialized even on error
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [
    session?.token, 
    status, 
    router, 
    handleAuthError, 
    API_BASE_URL, 
    calculateStats, 
    isInitialized,
    CACHE_DURATION
  ]);

  // ============================================
  // REMOVE UNIVERSITY FROM SAVED LIST
  // ============================================
  const handleRemoveUniversity = useCallback(async (universityId) => {
    if (!session?.token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ universityId }),
      });

      if (response.status === 401) {
        const errorData = await response.json();
        await handleAuthError(errorData.error || 'Authentication failed');
        return;
      }

      if (response.ok) {
        // Optimistic update - immediately remove from UI
        setUniversities(prev => {
          const updated = prev.filter(u => u.id !== universityId);
          // Also update stats
          const newStats = calculateStats(updated);
          setStats(newStats);
          return updated;
        });
        
        // Update cache timestamp to prevent immediate refetch
        lastSuccessfulFetchRef.current = Date.now();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove university');
      }
    } catch (err) {
      console.error('Error removing university:', err);
      
      if (err.message?.toLowerCase().includes('jwt') || 
          err.message?.toLowerCase().includes('token')) {
        await handleAuthError(err.message);
      }
    }
  }, [session?.token, handleAuthError, API_BASE_URL, calculateStats]);

  // ============================================
  // EFFECT: Redirect unauthenticated users
  // ============================================
  useEffect(() => {
    if (status !== "loading" && status !== "authenticated") {
      router.push('/onboarding/signup');
    }
  }, [status, router]);

  // ============================================
  // EFFECT: Initial data fetch (ONLY ONCE)
  // ============================================
  useEffect(() => {
    // Only fetch when:
    // 1. Session is authenticated
    // 2. Not yet initialized
    // 3. Not currently fetching
    if (status === "authenticated" && !isInitialized && !isFetchingRef.current) {
      console.log('🚀 Initial fetch triggered');
      fetchSavedUniversities();
    }
  }, [status, isInitialized, fetchSavedUniversities]);

  // ============================================
  // EFFECT: Cleanup on unmount
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Abort any ongoing fetch
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  // ============================================
  // EFFECT: Background refresh on tab visibility
  // Only refreshes if data is stale (15+ minutes)
  // ============================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitialized) {
        const now = Date.now();
        const timeSinceLastFetch = now - lastSuccessfulFetchRef.current;
        
        // Only refresh if data is stale (15+ minutes old)
        if (timeSinceLastFetch > STALE_DURATION) {
          console.log('📡 Background refresh - data is stale');
          fetchSavedUniversities({ silent: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, STALE_DURATION, fetchSavedUniversities]);

  // ============================================
  // MANUAL REFETCH FUNCTION
  // ============================================
  const refetch = useCallback(() => {
    console.log('🔄 Manual refetch triggered');
    return fetchSavedUniversities({ forceRefresh: true });
  }, [fetchSavedUniversities]);

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
    error,
    isInitialized,
    
    // Actions
    handleRemoveUniversity,
    refetch,
  };
};