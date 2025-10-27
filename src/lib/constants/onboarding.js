/**
 * Onboarding steps configuration
 */
export const ONBOARDING_STEPS = [
  "Countries",
  "Courses", 
  "Study Level",
  "Academic Info",
  "Payment",
  "Loading",
];

/**
 * Loading messages for different states
 */
export const LOADING_MESSAGES = {
  SETUP: "Setting up your experience...",
  CHECKING_USER: "Checking user status...",
  PROCESSING_LOGIN: "Processing login...",
  INITIALIZING: "Initializing session...",
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_DATA: "authData",
};

/**
 * API configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";