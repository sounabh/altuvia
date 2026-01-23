// ==========================================
// FILE: app/api/auth/[...nextauth]/route.js
// DESCRIPTION: NextAuth.js API route configuration for authentication
// ==========================================

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE_URL } from "@/lib/constants/auth";

// ==========================================
// AUTHENTICATION OPTIONS CONFIGURATION
// ==========================================

export const authOptions = {
  // ==========================================
  // PROVIDERS CONFIGURATION
  // ==========================================

  providers: [
    // ==========================================
    // CREDENTIALS PROVIDER (Email/Password)
    // ==========================================

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        isSignup: { label: "Is Signup", type: "boolean" },
      },

      async authorize(credentials) {
        try {
          // Determine endpoint based on signup/login flow
          const endpoint =
            credentials.isSignup === "true"
              ? `${API_BASE_URL}/api/user/signup`
              : `${API_BASE_URL}/api/user/signin`;

          // Make API call to backend authentication service
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              name: credentials.email.split("@")[0], // Generate name from email
            }),
          });

          const userData = await res.json();

          // Return user object if authentication successful
          if (res.ok && userData.success) {
            return {
              id: userData.data.userId,
              email: userData.data.email,
              name: userData.data.name,
              image: userData.data.image,
              provider: "credentials",
              token: userData.token,
              hasCompleteProfile: userData.data.hasCompleteProfile || false,
              isNewUser: credentials.isSignup === "true",
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

    // ==========================================
    // GOOGLE OAUTH PROVIDER
    // ==========================================

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ==========================================
    // LINKEDIN OAUTH PROVIDER (Custom Implementation)
    // ==========================================

    {
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile email",
          response_type: "code",
        },
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        params: {
          grant_type: "authorization_code",
        },

        // Custom token request handler for LinkedIn
        async request({ client, params, checks, provider }) {
          const redirectUri = `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/auth/callback/linkedin`;

          const response = await fetch(
            "https://www.linkedin.com/oauth/v2/accessToken",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                code: params.code,
                redirect_uri: redirectUri,
              }),
            }
          );

          const tokens = await response.json();

          if (!response.ok) {
            console.error("❌ LinkedIn token exchange failed:", tokens);
            throw new Error(
              `LinkedIn token exchange failed: ${response.status}`
            );
          }

          return { tokens };
        },
      },

      // Custom userinfo request handler
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
        async request({ tokens, provider }) {
          const response = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`LinkedIn API request failed: ${response.status}`);
          }

          return await response.json();
        },
      },

      // Profile transformation for LinkedIn data
      profile(profile) {
        return {
          id: profile.sub || profile.id,
          name:
            profile.name ||
            `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
          email: profile.email || null,
          image: profile.picture || null,
          provider: "linkedin",
        };
      },
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      checks: ["state"],
      protection: "state",
    },
  ],

  // ==========================================
  // CALLBACKS CONFIGURATION
  // ==========================================

  callbacks: {
    // ==========================================
    // SIGNIN CALLBACK: Handles OAuth user creation/verification
    // ==========================================

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider !== "credentials") {
          try {
            const response = await fetch(
              `${API_BASE_URL}/api/user/oauth-signin`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                  name: user.name,
                  provider: account.provider,
                  image: user.image,
                }),
              }
            );

            if (response.ok) {
              const userData = await response.json();

              console.log("🔗 OAuth backend response:", {
                backendUserId: userData.data.userId,
                providerUserId: user.id,
              });

              user.id = userData.data.userId;
              user.token = userData.token;
              user.hasCompleteProfile =
                userData.data.hasCompleteProfile || false;
              user.isNewUser = userData.isNewUser || false;

              console.log("✅ User ID set to database ID:", user.id);

              return true;
            } else {
              console.error("❌ OAuth backend verification failed");
              return false;
            }
          } catch (error) {
            console.error("❌ OAuth backend error:", error);
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error("❌ Sign in error:", error);
        return true;
      }
    },

    // ==========================================
    // JWT CALLBACK: Token creation and management
    // ==========================================

    async jwt({ token, user, account, trigger, session }) {
      try {
        // Handle new sign-in
        if (account && user) {
          return {
            ...token,
            provider: account.provider,
            accessToken: user.token,
            refreshToken: account.refresh_token,
            accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000,
            hasCompleteProfile: user.hasCompleteProfile || false,
            isNewUser: user.isNewUser || false,
            userId: user.id,
            name: user.name,
            email: user.email,
            picture: user.image,
            sub: user.id,
          };
        }

        // ✅ FIX: Handle session updates from profile completion AND profile updates
        if (trigger === "update" && session) {
          console.log("🔄 JWT - Session update received:", session);

          return {
            ...token,
            // Update profile completion flags
            hasCompleteProfile: session.hasCompleteProfile ?? token.hasCompleteProfile,
            isNewUser: session.isNewUser ?? token.isNewUser,
            accessToken: session.token ?? token.accessToken,

            // ✅ FIXED: Update user profile fields (name, email, picture)
            name: session.user?.name ?? token.name,
            email: session.user?.email ?? token.email,
            picture: session.user?.image ?? token.picture,
          };
        }

        // Check if token needs refresh
        if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
          return token;
        }

        // Attempt token refresh if refresh token exists
        if (token.refreshToken) {
          return await refreshAccessToken(token);
        }

        return token;
      } catch (error) {
        console.error("❌ JWT callback error:", error);
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },

    // ==========================================
    // SESSION CALLBACK: Session data preparation
    // ==========================================

    async session({ session, token }) {
      try {
        if (token) {
          console.log("📦 Session callback - Token data:", {
            userId: token.userId,
            name: token.name,
            email: token.email,
            hasCompleteProfile: token.hasCompleteProfile,
            isNewUser: token.isNewUser,
          });

          // Populate session with user data
          session.provider = token.provider;
          session.userId = token.userId;
          session.token = token.accessToken;
          session.error = token.error;
          session.hasCompleteProfile = token.hasCompleteProfile || false;
          session.isNewUser = token.isNewUser || false;

          // Populate user object in session
          if (session.user) {
            session.user.id = token.userId;
            session.user.name = token.name || session.user.name;
            session.user.email = token.email || session.user.email;
            session.user.image = token.picture || session.user.image;
          }

          console.log("✅ Session prepared:", {
            userId: session.userId,
            name: session.user?.name,
            email: session.user?.email,
          });
        }

        return session;
      } catch (error) {
        console.error("❌ Session callback error:", error);
        return session;
      }
    },

    // ==========================================
    // REDIRECT CALLBACK: URL redirection handling
    // ==========================================

    async redirect({ url, baseUrl }) {
      try {
        // Preserve error URLs
        if (url.includes("/auth/error") || url.includes("error=")) {
          return url;
        }

        // Handle relative URLs
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }

        // Validate and handle absolute URLs
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);

          if (urlObj.origin === baseUrlObj.origin) {
            return url;
          }
        } catch (urlError) {
          console.warn("⚠️ Invalid URL provided:", url);
        }

        // Fallback to base URL
        return baseUrl;
      } catch (error) {
        console.error("❌ Redirect callback error:", error);
        return baseUrl;
      }
    },
  },

  // ==========================================
  // EVENTS CONFIGURATION
  // ==========================================

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("🎉 Sign in event:", {
        userId: user.id,
        email: user.email,
        provider: account.provider,
      });
    },
    async signOut({ token }) {
      console.log("👋 Sign out event:", {
        userId: token.userId,
      });
    },
  },

  // ==========================================
  // SESSION CONFIGURATION
  // ==========================================

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  // ==========================================
  // JWT CONFIGURATION
  // ==========================================

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  // ==========================================
  // DEBUGGING & LOGGING CONFIGURATION
  // ==========================================

  debug: process.env.NODE_ENV === "development",

  // ==========================================
  // CUSTOM PAGE PATHS
  // ==========================================

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
  },

  // ==========================================
  // LOGGER CONFIGURATION
  // ==========================================

  logger: {
    error(code, metadata) {
      console.error("🚨 NextAuth Error:", { code, metadata });
    },
    warn(code) {
      console.warn("⚠️ NextAuth Warning:", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("🐛 NextAuth Debug:", { code, metadata });
      }
    },
  },
};

// ==========================================
// TOKEN REFRESH FUNCTION
// ==========================================

async function refreshAccessToken(token) {
  try {
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

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        error: undefined,
      };
    }

    return token;
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// ==========================================
// API ROUTE HANDLER
// ==========================================

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };