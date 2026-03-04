/**
 * useDashboardData.js  (optimized)
 *
 * Orchestrates SWR + auth + data extraction.
 * All logic sub-concerns are delegated to focused sub-modules:
 *   - createFetcher       → auth-aware SWR fetcher
 *   - calculateStats      → client-side stats aggregation
 *   - useAuthGuard        → JWT error handling + redirect
 *   - useRemoveUniversity → optimistic remove action
 *
 * No logic was changed — only moved to the right home.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession }    from 'next-auth/react';
import { useRouter }     from 'next/navigation';
import useSWR            from 'swr';

import { createFetcher }       from './apicall/createFetcher';
import { calculateStats }      from './dashboard/calculateStats';
import { useAuthGuard }        from './dashboard/useAuthGuard';
import { useRemoveUniversity } from './dashboard/useRemoveUniversity';

// SWR config object is stable (defined once at module level, not inside render)
const SWR_CONFIG = {
  revalidateOnFocus:      true,
  revalidateOnReconnect:  true,
  revalidateOnMount:      true,
  revalidateIfStale:      true,
  dedupingInterval:       2000,
  focusThrottleInterval:  5000,
  shouldRetryOnError:     true,
  errorRetryCount:        3,
  errorRetryInterval:     1000,
  refreshInterval:        0,
};

export const useDashboardData = () => {
  // ── Auth / routing ──────────────────────────────────────────────────────────
  const { data: session, status } = useSession();
  const router = useRouter();
  const mountedRef = useRef(true);

  // ── Auth guard (sign-out + redirect on JWT errors) ─────────────────────────
  const { handleAuthError } = useAuthGuard();

  // ── Constants ───────────────────────────────────────────────────────────────
  const API_BASE_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
    []
  );

  // ── Initialization flag ─────────────────────────────────────────────────────
  const [isInitialized, setIsInitialized] = useState(false);

  // ── SWR ─────────────────────────────────────────────────────────────────────
  const shouldFetch = status === 'authenticated' && !!session?.token;

  // Memoize fetcher — only recreates when token/baseUrl changes
  const fetcher = useMemo(
    () => (shouldFetch ? createFetcher(session.token, API_BASE_URL) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shouldFetch, session?.token, API_BASE_URL]
  );

  const { data, error, isValidating, mutate } = useSWR(
    shouldFetch ? '/api/university/saved' : null,
    fetcher,
    {
      ...SWR_CONFIG,
      onSuccess: () => {
        if (mountedRef.current) {
          console.log('✅ SWR data fetched:', data?.universities?.length ?? 0, 'universities');
          setIsInitialized(true);
        }
      },
      onError: (err) => {
        if (mountedRef.current) {
          console.error('❌ SWR error:', err);
          setIsInitialized(true);
        }
      },
    }
  );

  // ── Auth error side-effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!error || !mountedRef.current) return;

    if (
      error.status === 401 ||
      error.message?.toLowerCase().includes('jwt') ||
      error.message?.toLowerCase().includes('token')
    ) {
      handleAuthError(error.message || 'Authentication failed');
    }
  }, [error, handleAuthError]);

  // ── Redirect unauthenticated users ──────────────────────────────────────────
  useEffect(() => {
    if (status !== 'loading' && status !== 'authenticated') {
      router.push('/onboarding/signup');
    }
  }, [status, router]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Derived data (stable references via useMemo) ────────────────────────────
  const universities = useMemo(() => data?.universities ?? [], [data?.universities]);
  const userProfile  = useMemo(() => data?.userProfile  ?? null, [data?.userProfile]);
  const cvSummary    = useMemo(() => data?.cvSummary    ?? null, [data?.cvSummary]);

  // Use server-computed stats when available (avoids redundant client pass)
  const stats = useMemo(
    () => data?.stats ?? calculateStats(universities),
    [data?.stats, universities]
  );

  // ── Remove action ───────────────────────────────────────────────────────────
  const { handleRemoveUniversity } = useRemoveUniversity({
    token: session?.token,
    apiBaseUrl: API_BASE_URL,
    mutate,
    handleAuthError,
  });

  // ── Manual refetch ──────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    console.log('🔄 Manual refetch triggered');
    try { await mutate(); }
    catch (err) { console.error('Error refetching data:', err); }
  }, [mutate]);

  // ── Loading / error states ──────────────────────────────────────────────────
  const loading = (!data && !error && isValidating) || (!isInitialized && isValidating);
  const errorMessage = error ? (error.message || 'Failed to load dashboard data') : null;

  return {
    universities,
    userProfile,
    cvSummary,
    stats,
    loading,
    error: errorMessage,
    isInitialized,
    isValidating,
    handleRemoveUniversity,
    refetch,
    mutate,
  };
};

export default useDashboardData;