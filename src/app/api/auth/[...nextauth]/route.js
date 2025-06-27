// Import NextAuth core
import NextAuth from 'next-auth'

// Import the authentication providers you want to use
import GoogleProvider from 'next-auth/providers/google'

// Define the NextAuth configuration object
export const authOptions = {
  // 1. Set up providers (Google and LinkedIn)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // LinkedIn configuration using OpenID Connect (recommended approach)
    {
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile", // Only use available scopes
          response_type: "code",
        },
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        params: {
          grant_type: "authorization_code",
        },
        // Add custom token request to ensure client_secret is included
        async request({ client, params, checks, provider }) {
          // Construct the redirect URI manually since it's not being passed correctly
          const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/linkedin`;
          
          console.log('🔄 LinkedIn token exchange request:', {
            code: params.code ? 'present' : 'missing',
            redirect_uri: redirectUri,
            client_id: process.env.LINKEDIN_CLIENT_ID ? 'present' : 'missing'
          });

          const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Accept": "application/json",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: process.env.LINKEDIN_CLIENT_ID,
              client_secret: process.env.LINKEDIN_CLIENT_SECRET,
              code: params.code,
              redirect_uri: redirectUri,
            }),
          });

          const tokens = await response.json();

          if (!response.ok) {
            console.error('❌ LinkedIn token exchange failed:', tokens);
            console.error('❌ Request details:', {
              code: params.code,
              redirect_uri: redirectUri,
              client_id: process.env.LINKEDIN_CLIENT_ID
            });
            throw new Error(`LinkedIn token exchange failed: ${response.status} ${JSON.stringify(tokens)}`);
          }

          console.log('✅ LinkedIn token exchange successful');
          return { tokens };
        },
      },
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo", // OpenID Connect userinfo endpoint
        async request({ tokens, provider }) {
          try {
            console.log('🔍 Fetching LinkedIn user info...')
            
            const response = await fetch("https://api.linkedin.com/v2/userinfo", {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              console.error('❌ LinkedIn userinfo request failed:', response.status, response.statusText)
              throw new Error(`LinkedIn API request failed: ${response.status}`)
            }

            const profile = await response.json()
            console.log('✅ LinkedIn profile fetched successfully')
            
            return profile
          } catch (error) {
            console.error('❌ Error fetching LinkedIn profile:', error)
            throw error
          }
        },
      },
      profile(profile) {
        console.log('🔄 Processing LinkedIn profile data')
        
        return {
          id: profile.sub || profile.id,
          name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
          email: profile.email || null, // May be null if not available
          image: profile.picture || null,
          provider: 'linkedin'
        }
      },
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      checks: ["state"], // Enable state parameter for security
      protection: "state", // Additional CSRF protection
    },
  ],

  // 2. Define callback functions
  callbacks: {
    // Triggered when a user signs in
    async signIn({ user, account, profile }) {
      try {
        console.log('🔐 Sign In Attempt:', {
          provider: account?.provider,
          userId: user?.id,
          hasEmail: !!user?.email,
          timestamp: new Date().toISOString(),
        })

        // Handle OAuth errors gracefully - don't prevent sign-in
        if (account?.error) {
          console.warn('⚠️ OAuth error during sign-in:', account.error)
          // Still allow sign-in to continue, error will be handled in session
        }

        // Always allow sign-in for valid OAuth responses
        return true
      } catch (error) {
        console.error('❌ Sign in error:', error)
        // Return true to prevent redirect to error page
        return true
      }
    },

    // Called whenever a session is checked or created
    async session({ session, token }) {
      try {
        console.log('📋 Session Created:', {
          provider: token?.provider,
          userId: token?.sub,
          hasEmail: !!session?.user?.email,
        })

        // Add custom properties to the session object
        if (token) {
          session.provider = token.provider
          session.userId = token.sub
          session.accessToken = token.accessToken
          session.error = token.error
          
          // Flag if user needs to provide email separately
          session.needsEmail = !session.user?.email || 
                              session.user.email.includes('placeholder') ||
                              !session.user.email.includes('@')
        }

        return session
      } catch (error) {
        console.error('❌ Session callback error:', error)
        return session
      }
    },

    // Called when a new JWT token is created or updated
    async jwt({ token, user, account, profile }) {
      try {
        // Initial sign in
        if (account && user) {
          console.log('🔑 JWT Token Created:', {
            provider: account.provider,
            userId: user.id,
            hasRefreshToken: !!account.refresh_token,
            expiresAt: account.expires_at,
            timestamp: new Date().toISOString(),
          })

          return {
            ...token,
            provider: account.provider,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpires: account.expires_at ? account.expires_at * 1000 : null,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            }
          }
        }

        // Return previous token if the access token has not expired yet
        if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
          console.log('✅ Access token still valid')
          return token
        }

        // Access token has expired, try to update it
        if (token.refreshToken) {
          console.log('🔄 Attempting to refresh access token')
          return await refreshAccessToken(token)
        }

        console.log('⚠️ No refresh token available, returning existing token')
        return token

      } catch (error) {
        console.error('❌ JWT callback error:', error)
        return {
          ...token,
          error: "RefreshAccessTokenError",
        }
      }
    },

    // Add redirect callback to handle redirects properly
    async redirect({ url, baseUrl }) {
      try {
        console.log('🔄 Redirect requested:', { url, baseUrl })
        
        // Don't redirect on error - stay on current page
        if (url.includes('/auth/error') || url.includes('error=')) {
          console.log('⚠️ Error detected, not redirecting')
          return url // Return the current URL to stay on same page
        }
        
        // Handle successful callback - redirect to intended destination
        if (url.includes('/auth/callback') && !url.includes('error')) {
          const successUrl = `${baseUrl}/onboarding/signup`
          console.log('✅ Successful callback, redirecting to:', successUrl)
          return successUrl
        }
        
        // Handle relative URLs
        if (url.startsWith("/")) {
          const redirectUrl = `${baseUrl}${url}`
          console.log('✅ Redirecting to relative URL:', redirectUrl)
          return redirectUrl
        }
        
        // Handle same-origin URLs
        try {
          const urlObj = new URL(url)
          const baseUrlObj = new URL(baseUrl)
          
          if (urlObj.origin === baseUrlObj.origin) {
            console.log('✅ Redirecting to same-origin URL:', url)
            return url
          }
        } catch (urlError) {
          console.warn('⚠️ Invalid URL provided:', url)
        }
        
        // Default behavior - return the original URL or baseUrl
        console.log('🔒 Using default redirect behavior')
        return url.startsWith('http') ? baseUrl : `${baseUrl}${url}`
        
      } catch (error) {
        console.error('❌ Redirect callback error:', error)
        return baseUrl
      }
    },
  },

  // 3. Add comprehensive event logging
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('📝 Authentication Event - Sign In:', {
        event: 'signIn',
        provider: account?.provider,
        isNewUser: isNewUser,
        userId: user?.id,
        userEmail: user?.email ? 'provided' : 'not_provided',
        timestamp: new Date().toISOString(),
      })
    },
    
    async signOut({ token }) {
      console.log('📝 Authentication Event - Sign Out:', {
        event: 'signOut',
        provider: token?.provider,
        userId: token?.sub,
        timestamp: new Date().toISOString(),
      })
    },
    
    async createUser({ user }) {
      console.log('📝 Authentication Event - User Created:', {
        event: 'createUser',
        userId: user?.id,
        timestamp: new Date().toISOString(),
      })
    },
    
    async session({ session, token }) {
      // Only log in development to avoid spam
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Session Event:', {
          provider: token?.provider,
          userId: token?.sub,
          hasError: !!token?.error,
        })
      }
    },
  },

  // 4. Session configuration (JWT strategy)
  session: {
    strategy: 'jwt', // Use JWT instead of database sessions
    maxAge: 30 * 24 * 60 * 60, // Session valid for 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // 5. JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // JWT valid for 30 days
  },

  // 6. Enable debug logging in development only
  debug: process.env.NODE_ENV === 'development',

  // 7. Remove custom error page to prevent redirects on error
  pages: {
    signIn: '/auth/signin',
    // error: '/auth/error', // Commented out to prevent error redirects
    signOut: '/auth/signout',
  },

  // 8. Add error handling
  logger: {
    error(code, metadata) {
      console.error('🚨 NextAuth Error:', { code, metadata })
    },
    warn(code) {
      console.warn('⚠️ NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 NextAuth Debug:', { code, metadata })
      }
    },
  },
}

// Helper function to refresh access tokens
async function refreshAccessToken(token) {
  try {
    console.log('🔄 Refreshing access token for provider:', token.provider)

    if (token.provider === 'linkedin') {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          refresh_token: token.refreshToken,
        }),
      })

      const refreshedTokens = await response.json()

      if (!response.ok) {
        console.error('❌ Token refresh failed:', refreshedTokens)
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      console.log('✅ Access token refreshed successfully')
      
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + (refreshedTokens.expires_in * 1000),
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        error: undefined, // Clear any previous errors
      }
    }

    if (token.provider === 'google') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: token.refreshToken,
        }),
      })

      const refreshedTokens = await response.json()

      if (!response.ok) {
        console.error('❌ Google token refresh failed:', refreshedTokens)
        throw new Error(`Google token refresh failed: ${response.status}`)
      }

      console.log('✅ Google access token refreshed successfully')
      
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + (refreshedTokens.expires_in * 1000),
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        error: undefined,
      }
    }

    // For providers without refresh capability, return the existing token
    console.log('⚠️ No refresh logic for provider:', token.provider)
    return token

  } catch (error) {
    console.error('❌ Error refreshing access token:', error)

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

// Wrap the config in a handler using NextAuth
const handler = NextAuth(authOptions)

// Export the handler for GET and POST methods (required in App Router)
export { handler as GET, handler as POST }

// Additional utility function to check if user needs email collection
export function needsEmailCollection(session) {
  return session?.needsEmail || 
         !session?.user?.email || 
         session.user.email.includes('placeholder') ||
         !session.user.email.includes('@')
}