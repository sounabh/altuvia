/**
 * useAuthGuard.js
 *
 * Handles JWT/auth error detection + sign-out + redirect.
 * Isolated so it can be reused across hooks and independently tested.
 */

import { useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const JWT_KEYWORDS = [
  'jwt',
  'token',
  'expired',
  'invalid',
  'authentication',
  'unauthorized',
  'unauthenticated',
  '401',
  'no authentication token',   // <-- added to catch missing token error
];

const isJwtError = (msg) => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return JWT_KEYWORDS.some((kw) => lower.includes(kw));
};

/**
 * @returns {{ handleAuthError: (msg: string) => Promise<void> }}
 */
export function useAuthGuard() {
  const router = useRouter();
  const handlingRef = useRef(false);

  const handleAuthError = useCallback(
    async (errorMessage) => {
      if (handlingRef.current) return; // prevent concurrent handling
      handlingRef.current = true;

      console.error('Authentication error:', errorMessage);

      if (isJwtError(errorMessage)) {
        try {
          await signOut({ redirect: false });
          router.push('/onboarding/signup');
        } finally {
          handlingRef.current = false;
        }
      } else {
        handlingRef.current = false;
      }
    },
    [router]
  );

  return { handleAuthError };
}