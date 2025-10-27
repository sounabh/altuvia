export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const AUTH_STORAGE_KEY = "authData";

export const TOKEN_EXPIRY_HOURS = 24;

export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  LINKEDIN: "linkedin",
};