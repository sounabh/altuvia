/**
 * createFetcher.js  (hook utility)
 *
 * Factory that returns a SWR-compatible fetcher bound to an auth token.
 * Extracted so useDashboardData stays lean and this is independently testable.
 */

/**
 * @param {string} token       - JWT bearer token
 * @param {string} apiBaseUrl  - e.g. "http://localhost:5000"
 * @returns {(url: string) => Promise<any>}
 */
export function createFetcher(token, apiBaseUrl) {
  return async (url) => {
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${apiBaseUrl}${url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      const error = Object.assign(new Error('Authentication failed'), {
        status: 401,
        info: await response.json(),
      });
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json();
      const error = Object.assign(
        new Error(errorData.error || 'Failed to fetch data'),
        { status: response.status, info: errorData }
      );
      throw error;
    }

    return response.json();
  };
}