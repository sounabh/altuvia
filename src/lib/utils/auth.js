/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
export const validatePassword = (password) => {
  return password.length >= 6;
};

/**
 * Gets authentication token from NextAuth session
 * @param {Object} session - NextAuth session object
 * @returns {string|null} JWT token or null
 */
export const getAuthToken = (session) => {
  return session?.token || null;
};

/**
 * Gets user ID from NextAuth session
 * @param {Object} session - NextAuth session object
 * @returns {string|null} User ID or null
 */
export const getUserId = (session) => {
  return session?.userId || session?.user?.id || null;
};

/**
 * Checks if user has complete profile
 * @param {Object} session - NextAuth session object
 * @returns {boolean} True if profile is complete
 */
export const hasCompleteProfile = (session) => {
  return session?.hasCompleteProfile || false;
};

/**
 * Checks if user is authenticated
 * @param {Object} session - NextAuth session object
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = (session) => {
  return !!(session && session.user && session.token);
};

/**
 * Gets user email from NextAuth session
 * @param {Object} session - NextAuth session object
 * @returns {string|null} User email or null
 */
export const getUserEmail = (session) => {
  return session?.user?.email || null;
};

/**
 * Gets user name from NextAuth session
 * @param {Object} session - NextAuth session object
 * @returns {string|null} User name or null
 */
export const getUserName = (session) => {
  return session?.user?.name || null;
};

/**
 * Checks if user is a new user
 * @param {Object} session - NextAuth session object
 * @returns {boolean} True if user is new
 */
export const isNewUser = (session) => {
  return session?.isNewUser || false;
};