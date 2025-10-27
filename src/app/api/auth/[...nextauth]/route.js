import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { API_BASE_URL } from "@/lib/constants/auth"; //api base url

export const authOptions = {

  //credentials provider for normal sign in 

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) { //authorize function will execute whenever have data from fields 

        try {
          const res = await fetch(`${API_BASE_URL}/api/user/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });

          const userData = await res.json();

          if (res.ok && userData.success) {
           // console.log("✅ Credentials authentication successful");


           //payload
            return {
              id: userData.data.userId,
              email: userData.data.email,
              name: userData.data.name,
              image: userData.data.image,
              provider: "credentials",
              token: userData.token,
              hasCompleteProfile: userData.data.hasCompleteProfile || false,
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

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // LinkedIn OAuth Provider
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
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
        async request({ tokens, provider }) {
          const response = await fetch(
            "https://api.linkedin.com/v2/userinfo",
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`LinkedIn API request failed: ${response.status}`);
          }

          return await response.json();
        },
      },
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


  //These are event hooks for customizing token/session behavior.
  callbacks: {
    async signIn({ user, account, profile }) {
      try {

       /* console.log("🔐 Sign In Attempt:", {
          provider: account?.provider,
          userId: user?.id,
          hasEmail: !!user?.email,
        });*/

        // For OAuth providers, verify with backend

        // if account comes from google/linkedin then send reqs to backend 
        if (account?.provider !== "credentials") {
          try {
            const response = await fetch(`${API_BASE_URL}/api/user/oauth-signin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                provider: account.provider,
                image: user.image,
              }),
            });

            if (response.ok) {
              const userData = await response.json();
              
              // Store backend data in user object for JWT callback
              user.token = userData.token;
              user.userId = userData.data.userId;
              user.hasCompleteProfile = userData.data.hasCompleteProfile || false;
              user.isNewUser = userData.isNewUser || false;
              
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

    async jwt({ token, user, account, trigger, session }) {
      try {
        // Initial sign in
        if (account && user) {

        /*  console.log("🔑 JWT Token Created:", {
            provider: account.provider,
            userId: user.id,
            hasCompleteProfile: user.hasCompleteProfile,
          });*/

          return {
            ...token,
            provider: account.provider,
            accessToken: user.token || account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            hasCompleteProfile: user.hasCompleteProfile || false,
            isNewUser: user.isNewUser || false,
            userId: user.userId || user.id,
            name: user.name,
            email: user.email,
            picture: user.image,
            sub: user.id,
          };
        }

        // Handle session updates via update() function whenver your session is going to update after profile creation
        if (trigger === "update" && session) {
          //console.log("🔄 JWT Token Updated via session.update()");
          return {
            ...token,
            ...session,
          };
        }

        // Token still valid
        if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
          return token;
        }

        // Token expired, refresh if possible
        if (token.refreshToken) {
         // console.log("🔄 Attempting to refresh access token");
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

    async session({ session, token }) {
      try {
      /*  console.log("📋 Session Created:", {
          provider: token?.provider,
          userId: token?.sub,
          hasCompleteProfile: token?.hasCompleteProfile,
        });*/

        if (token) {
          session.provider = token.provider;
          session.userId = token.userId || token.sub;
          session.token = token.accessToken;
          session.error = token.error;
          session.hasCompleteProfile = token.hasCompleteProfile || false;
          session.isNewUser = token.isNewUser || false;

          if (session.user) {
            session.user.id = token.sub;
            session.user.name = token.name || session.user.name;
            session.user.email = token.email || session.user.email;
            session.user.image = token.picture || session.user.image;
          }
        }

        return session;
      } catch (error) {
        console.error("❌ Session callback error:", error);
        return session;
      }
    },

    async redirect({ url, baseUrl }) {
      try {
        // Don't redirect on error
        if (url.includes("/auth/error") || url.includes("error=")) {
          return url;
        }

        // Handle relative URLs
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }

        // Handle same-origin URLs
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);

          if (urlObj.origin === baseUrlObj.origin) {
            return url;
          }
        } catch (urlError) {
          console.warn("⚠️ Invalid URL provided:", url);
        }

        return baseUrl;
      } catch (error) {
        console.error("❌ Redirect callback error:", error);
        return baseUrl;
      }
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {

     /* console.log("📝 Authentication Event - Sign In:", {
        event: "signIn",
        provider: account?.provider,
        isNewUser: isNewUser,
        userId: user?.id,
      });*/
    },

    async signOut({ token }) {
     /* console.log("📝 Authentication Event - Sign Out:", {
        event: "signOut",
        provider: token?.provider,
        userId: token?.sub,
      });*/
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: process.env.NODE_ENV === "development",

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
  },

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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };