// =============================================================================
// NEXTAUTH CONFIGURATION WITH GOOGLE, LINKEDIN & CREDENTIALS OAUTH PROVIDERS
// =============================================================================
// This file configures NextAuth.js for authentication with Google, LinkedIn
// and Credentials providers, including token management, session handling,
// and comprehensive error handling with detailed logging.
// ALL TOKENS SET TO 30 DAYS EXPIRATION
// =============================================================================

// Import NextAuth core library
import NextAuth from "next-auth";

// Import the authentication providers you want to use
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// =============================================================================
// MAIN NEXTAUTH CONFIGURATION OBJECT
// =============================================================================
// This object contains all the configuration settings for NextAuth including
// providers, callbacks, session management, and error handling
// =============================================================================

export const authOptions = {
  // ===========================================================================
  // 1. AUTHENTICATION PROVIDERS CONFIGURATION
  // ===========================================================================
  // Define which OAuth providers to support and their specific configurations
  // ===========================================================================

  providers: [
    // -------------------------------------------------------------------------
    // CREDENTIALS PROVIDER (EMAIL/PASSWORD)
    // -------------------------------------------------------------------------
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          //console.log('🔐 Credentials sign-in attempt:', credentials.email);

          const res = await fetch(
            `${process.env.BACKEND_URL}/api/user/signin`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(credentials),
            }
          );

          const userData = await res.json();

          if (res.ok && userData.success) {
            console.log("✅ Credentials authentication successful");

            // Store authentication data
            const authData = {
              userId: userData.data.userId,
              email: userData.data.email,
              name: userData.data.name,
              provider: userData.data.provider,
              lastLogin: new Date().toISOString(),
            };
            localStorage.setItem("authData", JSON.stringify(authData));

            return {
              id: userData.data.userId,
              email: userData.data.email,
              name: userData.data.name,
              provider: "credentials", // Custom provider identifier
              token: userData.token,
            };
          }

          console.error("❌ Credentials authentication failed:", userData);
          return null;
        } catch (error) {
          console.error("❌ Credentials authentication error:", error);
          return null;
        }
      },
    }),

    // -------------------------------------------------------------------------
    // GOOGLE OAUTH PROVIDER
    // -------------------------------------------------------------------------
    // Standard Google OAuth configuration using the official NextAuth provider
    // Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
    // -------------------------------------------------------------------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // -------------------------------------------------------------------------
    // LINKEDIN OAUTH PROVIDER (CUSTOM IMPLEMENTATION)
    // -------------------------------------------------------------------------
    // Custom LinkedIn provider using OpenID Connect approach since LinkedIn's
    // API has specific requirements that need manual token exchange handling
    // -------------------------------------------------------------------------
    {
      // Provider identification
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",

      // Authorization endpoint configuration
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile email", // Only use available scopes (email requires special permission)
          response_type: "code", // Authorization code flow
        },
      },

      // Token exchange endpoint configuration
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        params: {
          grant_type: "authorization_code", // Standard OAuth2 authorization code grant
        },

        // Custom token request handler to ensure proper token exchange
        // This is needed because LinkedIn has specific requirements for token requests
        async request({ client, params, checks, provider }) {
          // Construct the redirect URI manually since it's not being passed correctly
          // This ensures the redirect URI matches exactly what was registered with LinkedIn
          const redirectUri = `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/auth/callback/linkedin`;

          // Log the token exchange attempt for debugging purposes
          console.log("🔄 LinkedIn token exchange request:", {
            code: params.code ? "present" : "missing",
            redirect_uri: redirectUri,
            client_id: process.env.LINKEDIN_CLIENT_ID ? "present" : "missing",
          });

          // Make the token exchange request to LinkedIn's API
          const response = await fetch(
            "https://www.linkedin.com/oauth/v2/accessToken",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded", // LinkedIn requires form-encoded data
                Accept: "application/json", // Expect JSON response
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                code: params.code, // Authorization code from the callback
                redirect_uri: redirectUri, // Must match registered redirect URI
              }),
            }
          );

          // Parse the response from LinkedIn
          const tokens = await response.json();

          // Handle token exchange errors
          if (!response.ok) {
            console.error("❌ LinkedIn token exchange failed:", tokens);
            console.error("❌ Request details:", {
              code: params.code,
              redirect_uri: redirectUri,
              client_id: process.env.LINKEDIN_CLIENT_ID,
            });
            throw new Error(
              `LinkedIn token exchange failed: ${
                response.status
              } ${JSON.stringify(tokens)}`
            );
          }

          console.log("✅ LinkedIn token exchange successful");
          return { tokens };
        },
      },

      // User information endpoint configuration
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo", // OpenID Connect userinfo endpoint

        // Custom userinfo request handler
        async request({ tokens, provider }) {
          try {
            console.log("🔍 Fetching LinkedIn user info...");

            // Fetch user profile data from LinkedIn using the access token
            const response = await fetch(
              "https://api.linkedin.com/v2/userinfo",
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`, // Bearer token authentication
                  "Content-Type": "application/json",
                },
              }
            );

            // Handle API request errors
            if (!response.ok) {
              console.error(
                "❌ LinkedIn userinfo request failed:",
                response.status,
                response.statusText
              );
              throw new Error(
                `LinkedIn API request failed: ${response.status}`
              );
            }

            const profile = await response.json();
            console.log("✅ LinkedIn profile fetched successfully");

            return profile;
          } catch (error) {
            console.error("❌ Error fetching LinkedIn profile:", error);
            throw error;
          }
        },
      },

      // Profile data transformation function
      // Converts LinkedIn's profile data to NextAuth's expected user object format
      profile(profile) {
        console.log("🔄 Processing LinkedIn profile data");

        return {
          id: profile.sub || profile.id, // Use OpenID Connect 'sub' field or fallback to 'id'
          name:
            profile.name ||
            `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
          email: profile.email || null, // May be null if not available or not requested
          image: profile.picture || null, // Profile picture URL
          provider: "linkedin", // Custom field to identify the provider
        };
      },

      // OAuth client credentials from environment variables
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,

      // Security checks configuration
      checks: ["state"], // Enable state parameter for CSRF protection
      protection: "state", // Additional CSRF protection
    },
  ],

  // ===========================================================================
  // 2. CALLBACK FUNCTIONS CONFIGURATION
  // ===========================================================================
  // These callbacks are triggered at various points in the authentication flow
  // and allow you to customize the behavior of NextAuth
  // ===========================================================================

  callbacks: {
    // -------------------------------------------------------------------------
    // SIGN IN CALLBACK
    // -------------------------------------------------------------------------
    // Triggered when a user attempts to sign in
    // Return true to allow sign in, false to deny
    // -------------------------------------------------------------------------
    async signIn({ user, account, profile }) {
      try {
        // Log the sign-in attempt for monitoring and debugging
        console.log("🔐 Sign In Attempt:", {
          provider: account?.provider,
          userId: user?.id,
          hasEmail: !!user?.email,
          timestamp: new Date().toISOString(),
        });

        // Handle OAuth errors gracefully - don't prevent sign-in
        // This allows the user to still sign in even if there are minor OAuth issues
        if (account?.error) {
          console.warn("⚠️ OAuth error during sign-in:", account.error);
          // Still allow sign-in to continue, error will be handled in session
        }

        // Always allow sign-in for valid OAuth responses
        // Additional validation logic can be added here if needed
        return true;
      } catch (error) {
        console.error("❌ Sign in error:", error);
        // Return true to prevent redirect to error page
        // This ensures users aren't stuck on error pages for recoverable issues
        return true;
      }
    },

    // -------------------------------------------------------------------------
    // SESSION CALLBACK
    // -------------------------------------------------------------------------
    // Called whenever a session is checked or created
    // This is where you can modify the session object that's returned to the client
    // -------------------------------------------------------------------------
    async session({ session, token }) {
      try {
        // Log session creation for monitoring
        console.log("📋 Session Created:", {
          provider: token?.provider,
          userId: token?.sub,
          hasEmail: !!session?.user?.email,
        });

        // Add custom properties to the session object
        // These properties will be available on the client side
        if (token) {
          session.provider = token.provider; // Which OAuth provider was used
          session.userId = token.sub; // User ID from the provider
          session.accessToken = token.accessToken; // Access token for API calls
          session.error = token.error; // Any errors that occurred

          // Flag if user needs to provide email separately
          // This is useful for providers that don't always return email addresses
          session.needsEmail =
            !session.user?.email ||
            session.user.email.includes("placeholder") ||
            !session.user.email.includes("@");
        }

        return session;
      } catch (error) {
        console.error("❌ Session callback error:", error);
        // Return the original session even if there's an error
        // This prevents breaking the user's session
        return session;
      }
    },

    // -------------------------------------------------------------------------
    // JWT CALLBACK
    // -------------------------------------------------------------------------
    // Called when a new JWT token is created or updated
    // This handles token lifecycle including refresh logic
    // -------------------------------------------------------------------------
    async jwt({ token, user, account, profile }) {
      try {
        // Initial sign in - when user first authenticates
        if (account && user) {
          console.log("🔑 JWT Token Created:", {
            provider: account.provider,
            userId: user.id,
            hasRefreshToken: !!account.refresh_token,
            expiresAt: account.expires_at,
            timestamp: new Date().toISOString(),
          });

          // Return the initial token with all necessary data
          // Set access token expiry to 30 days from now
          return {
            ...token,
            provider: account.provider, // OAuth provider name
            accessToken: account.access_token, // Access token from provider
            refreshToken: account.refresh_token, // Refresh token (if available)
            accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            },
          };
        }

        // Handle credentials provider sign-in (no account object)
        if (user) {
          console.log("🔑 JWT Token Created (Credentials):", {
            provider: user.provider,
            userId: user.id,
            timestamp: new Date().toISOString(),
          });

          return {
            ...token,
            provider: user.provider, // 'credentials' provider
            accessToken: null, // No access token for credentials
            accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          };
        }

        // Return previous token if the access token has not expired yet
        if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
          console.log("✅ Access token still valid");
          return token;
        }

        // Access token has expired, try to update it using refresh token
        if (token.refreshToken) {
          console.log("🔄 Attempting to refresh access token");
          return await refreshAccessToken(token);
        }

        // No refresh token available, return existing token
        // The user may need to re-authenticate
        console.log("⚠️ No refresh token available, returning existing token");
        return token;
      } catch (error) {
        console.error("❌ JWT callback error:", error);
        // Return token with error flag if something goes wrong
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },

    // -------------------------------------------------------------------------
    // REDIRECT CALLBACK
    // -------------------------------------------------------------------------
    // Handles redirects after authentication
    // This determines where users go after signing in or encountering errors
    // -------------------------------------------------------------------------
    async redirect({ url, baseUrl }) {
      try {
        console.log("🔄 Redirect requested:", { url, baseUrl });

        // Don't redirect on error - stay on current page
        // This prevents users from being bounced around on authentication errors
        if (url.includes("/auth/error") || url.includes("error=")) {
          console.log("⚠️ Error detected, not redirecting");
          return url; // Return the current URL to stay on same page
        }

        // Handle successful callback - redirect to intended destination
        if (url.includes("/auth/callback") && !url.includes("error")) {
          const successUrl = `${baseUrl}/onboarding/signup`;
          console.log("✅ Successful callback, redirecting to:", successUrl);
          return successUrl;
        }

        // Handle relative URLs by making them absolute
        if (url.startsWith("/")) {
          const redirectUrl = `${baseUrl}${url}`;
          console.log("✅ Redirecting to relative URL:", redirectUrl);
          return redirectUrl;
        }

        // Handle same-origin URLs for security
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);

          // Only allow redirects to the same origin for security
          if (urlObj.origin === baseUrlObj.origin) {
            console.log("✅ Redirecting to same-origin URL:", url);
            return url;
          }
        } catch (urlError) {
          console.warn("⚠️ Invalid URL provided:", url);
        }

        // Default behavior - return the original URL or baseUrl
        console.log("🔒 Using default redirect behavior");
        return url.startsWith("http") ? baseUrl : `${baseUrl}${url}`;
      } catch (error) {
        console.error("❌ Redirect callback error:", error);
        // Fallback to base URL if redirect logic fails
        return baseUrl;
      }
    },
  },

  // ===========================================================================
  // 3. EVENT HANDLERS CONFIGURATION
  // ===========================================================================
  // Event handlers for comprehensive logging and monitoring
  // These don't affect the authentication flow but provide visibility
  // ===========================================================================

  events: {
    // Sign in event handler
    async signIn({ user, account, profile, isNewUser }) {
      console.log("📝 Authentication Event - Sign In:", {
        event: "signIn",
        provider: account?.provider,
        isNewUser: isNewUser,
        userId: user?.id,
        userEmail: user?.email ? "provided" : "not_provided",
        timestamp: new Date().toISOString(),
      });
    },

    // Sign out event handler
    async signOut({ token }) {
      console.log("📝 Authentication Event - Sign Out:", {
        event: "signOut",
        provider: token?.provider,
        userId: token?.sub,
        timestamp: new Date().toISOString(),
      });
    },

    // User creation event handler (first-time sign in)
    async createUser({ user }) {
      console.log("📝 Authentication Event - User Created:", {
        event: "createUser",
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });
    },

    // Session event handler (only log in development to avoid spam)
    async session({ session, token }) {
      if (process.env.NODE_ENV === "development") {
        console.log("📝 Session Event:", {
          provider: token?.provider,
          userId: token?.sub,
          hasError: !!token?.error,
        });
      }
    },
  },

  // ===========================================================================
  // 4. SESSION CONFIGURATION - CHANGED TO 30 DAYS
  // ===========================================================================
  // Configure how sessions are managed and stored
  // ===========================================================================

  session: {
    strategy: "jwt", // Use JWT instead of database sessions (stateless)
    maxAge: 30 * 24 * 60 * 60, // Session valid for 30 days (in seconds)
    updateAge: 24 * 60 * 60, // Update session every 24 hours (in seconds)
  },

  // ===========================================================================
  // 5. JWT CONFIGURATION - CHANGED TO 30 DAYS
  // ===========================================================================
  // Configure JWT token settings
  // ===========================================================================

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // JWT valid for 30 days (in seconds)
  },

  // ===========================================================================
  // 6. DEVELOPMENT SETTINGS
  // ===========================================================================
  // Enable debug logging in development environment only
  // ===========================================================================

  debug: process.env.NODE_ENV === "development",

  // ===========================================================================
  // 7. CUSTOM PAGES CONFIGURATION
  // ===========================================================================
  // Define custom pages for authentication flow
  // Note: error page is commented out to prevent error redirects
  // ===========================================================================

  pages: {
    signIn: "/auth/signin", // Custom sign-in page
    // error: '/auth/error',        // Commented out to prevent error redirects
    signOut: "/auth/signout", // Custom sign-out page
  },

  // ===========================================================================
  // 8. CUSTOM LOGGER CONFIGURATION
  // ===========================================================================
  // Custom logging for NextAuth events and errors
  // ===========================================================================

  logger: {
    // Error logging
    error(code, metadata) {
      console.error("🚨 NextAuth Error:", { code, metadata });
    },

    // Warning logging
    warn(code) {
      console.warn("⚠️ NextAuth Warning:", code);
    },

    // Debug logging (development only)
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("🐛 NextAuth Debug:", { code, metadata });
      }
    },
  },
};

// =============================================================================
// HELPER FUNCTION: REFRESH ACCESS TOKENS - UPDATED FOR 30 DAY EXPIRY
// =============================================================================
// This function handles refreshing expired access tokens for different providers
// It's called automatically by the JWT callback when tokens expire
// =============================================================================

async function refreshAccessToken(token) {
  try {
    console.log("🔄 Refreshing access token for provider:", token.provider);

    // -------------------------------------------------------------------------
    // LINKEDIN TOKEN REFRESH
    // -------------------------------------------------------------------------
    if (token.provider === "linkedin") {
      const response = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            refresh_token: token.refreshToken,
          }),
        }
      );

      const refreshedTokens = await response.json();

      // Handle refresh failure
      if (!response.ok) {
        console.error("❌ Token refresh failed:", refreshedTokens);
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      console.log("✅ Access token refreshed successfully");

      // Return updated token with new access token and 30-day expiry
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Keep old refresh token if new one not provided
        error: undefined, // Clear any previous errors
      };
    }

    // -------------------------------------------------------------------------
    // GOOGLE TOKEN REFRESH
    // -------------------------------------------------------------------------
    if (token.provider === "google") {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: token.refreshToken,
        }),
      });

      const refreshedTokens = await response.json();

      // Handle refresh failure
      if (!response.ok) {
        console.error("❌ Google token refresh failed:", refreshedTokens);
        throw new Error(`Google token refresh failed: ${response.status}`);
      }

      console.log("✅ Google access token refreshed successfully");

      // Return updated token with new access token and 30-day expiry
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Keep old refresh token if new one not provided
        error: undefined, // Clear any previous errors
      };
    }

    // -------------------------------------------------------------------------
    // FALLBACK FOR UNSUPPORTED PROVIDERS
    // -------------------------------------------------------------------------
    // For providers without refresh capability, return the existing token
    console.log("⚠️ No refresh logic for provider:", token.provider);
    return token;
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);

    // Return token with error flag if refresh fails
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// =============================================================================
// NEXTAUTH HANDLER SETUP
// =============================================================================
// Wrap the configuration in a handler using NextAuth
// This creates the actual authentication endpoints
// =============================================================================

const handler = NextAuth(authOptions);

// Export the handler for GET and POST methods (required in App Router)
// These exports create the API routes at /api/auth/*
export { handler as GET, handler as POST };

// =============================================================================
// UTILITY FUNCTION: EMAIL COLLECTION CHECK
// =============================================================================
// Additional utility function to check if user needs email collection
// This is useful for providers that don't always return email addresses
// =============================================================================

export function needsEmailCollection(session) {
  return (
    session?.needsEmail ||
    !session?.user?.email ||
    session.user.email.includes("placeholder") ||
    !session.user.email.includes("@")
  );
}
