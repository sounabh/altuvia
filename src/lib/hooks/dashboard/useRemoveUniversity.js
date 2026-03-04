/**
 * useRemoveUniversity.js
 *
 * Encapsulates the optimistic-remove action so useDashboardData stays lean.
 * Handles: optimistic update → API call → revalidation → auth error fallback.
 */

import { useCallback } from 'react';
import { calculateStats } from './calculateStats';

const optimisticRemove = (universityId) => (currentData) => {
  if (!currentData) return currentData;

  const updatedUniversities = currentData.universities.filter(
    (u) => u.id !== universityId
  );

  return {
    ...currentData,
    universities: updatedUniversities,
    stats: calculateStats(updatedUniversities),
    count: updatedUniversities.length,
  };
};

/**
 * @param {object} opts
 * @param {string|undefined}  opts.token
 * @param {string}            opts.apiBaseUrl
 * @param {Function}          opts.mutate        - SWR mutate
 * @param {Function}          opts.handleAuthError
 * @returns {{ handleRemoveUniversity: (id: string) => Promise<void> }}
 */
export function useRemoveUniversity({ token, apiBaseUrl, mutate, handleAuthError }) {
  const handleRemoveUniversity = useCallback(
    async (universityId) => {
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      try {
        // Optimistic update — UI reflects change immediately
        await mutate(
          (currentData) => optimisticRemove(universityId)(currentData),
          {
            revalidate: false,
            optimisticData: optimisticRemove(universityId),
            rollbackOnError: true,
          }
        );

        // Actual API call
        const response = await fetch(`${apiBaseUrl}/api/university/toggleSaved`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ universityId }),
        });

        if (response.status === 401) {
          const errorData = await response.json();
          await handleAuthError(errorData.error || 'Authentication failed');
          await mutate(); // restore server state
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove university');
        }

        // Confirm server state
        await mutate();
        console.log('✅ University removed successfully');
      } catch (err) {
        console.error('❌ Error removing university:', err);
        await mutate(); // rollback

        if (
          err.message?.toLowerCase().includes('jwt') ||
          err.message?.toLowerCase().includes('token')
        ) {
          await handleAuthError(err.message);
        }
      }
    },
    [token, apiBaseUrl, mutate, handleAuthError]
  );

  return { handleRemoveUniversity };
}