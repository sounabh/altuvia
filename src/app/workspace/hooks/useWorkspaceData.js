import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export const useWorkspaceData = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchWorkspaceData = useCallback(async () => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setError("Please login to view your workspace");
      setLoading(false);
      router.push("/signin");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/essay/independent`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          router.push("/signin");
          return;
        }
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [status, router]);

  return {
    workspaceData,
    setWorkspaceData,
    loading,
    error,
    setError,
    fetchWorkspaceData,
    session,
    status
  };
};