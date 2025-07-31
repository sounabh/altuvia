"use client"; // Marks this as a Client Component in Next.js

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react"; // NextAuth authentication hooks
import { useRouter } from "next/navigation"; // Next.js navigation router
// UI components from Shadcn library
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";


// Base URL for API requests with fallback to local development
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";



export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  // ===== NextAuth Session Management ===== //
  const { data: session, status } = useSession(); // Access authentication session
  const router = useRouter(); // Router for navigation


  // ===== Component State Variables ===== //
  const [isLogin, setIsLogin] = useState(true); // Toggle between login/signup modes
  const [email, setEmail] = useState(""); // User email input
  const [password, setPassword] = useState(""); // User password input
  const [confirmPassword, setConfirmPassword] = useState(""); // Password confirmation (signup only)
  const [isLoading, setIsLoading] = useState(false); // Loading state during async operations
  const [error, setError] = useState(""); // Error message display
  const [hasExistingData, setHasExistingData] = useState(false); // Flag for existing localStorage auth data
  const [existingUserEmail, setExistingUserEmail] = useState(""); // Email from localStorage

  // ===== useEffect Hooks ===== //

  /**
   * Effect: Checks localStorage for existing auth credentials on component mount
   * Purpose: Pre-fills email and forces login mode if returning user
   * Dependencies: None (runs once on mount)
   */
  useEffect(() => {
    const checkExistingData = () => {
      try {
        // Safely access localStorage only in client-side context
        const authData = typeof window !== "undefined" 
          ? localStorage.getItem("authData") 
          : null;
        
        if (authData) {
          const parsedData = JSON.parse(authData);
          console.log("Parsed Auth Data from modal:", parsedData,);
          
          if (parsedData.email) {
            // Existing user detected - configure UI accordingly
            setHasExistingData(true);
            setExistingUserEmail(parsedData.email);
            setEmail(parsedData.email); // Pre-fill email field
            setIsLogin(true); // Force login mode
          }
        }
      } catch (error) {
        // Handle corrupted localStorage data
        localStorage.removeItem("authData");
      }
    };

    checkExistingData();
  }, []);

  /**
   * Effect: Clears error messages when switching auth modes
   * Purpose: Prevents stale error messages during UI transitions
   * Dependencies: isLogin state
   */
  useEffect(() => {
    setError("");
  }, [isLogin]);

  /**
   * Effect: Handles successful OAuth authentication
   * Trigger: NextAuth session changes
   * Purpose: Processes OAuth session data and connects to backend
   * Dependencies: session, isLoading
   */
  useEffect(() => {
    // Only process if we have a valid session and not already loading
    if (session && session.user && !isLoading) {
      handleOAuthSuccess(session);
    }
  }, [session, isLoading]);

  // ===== Authentication Handler Functions ===== //

  /**
   * Processes successful OAuth authentication
   * Steps:
   * 1. Verify email matches existing account (if any)
   * 2. Send OAuth data to backend for validation
   * 3. Store token in localStorage
   * 4. Determine onboarding/dashboard redirection
   */
  const handleOAuthSuccess = async (sessionData) => {
    try {
      setIsLoading(true);
      const oauthUser = sessionData.user;

      // Email consistency check for existing users
      if (hasExistingData && existingUserEmail !== oauthUser.email) {
        setError(`This ${sessionData.provider || 'OAuth'} account (${oauthUser.email}) doesn't match your existing profile (${existingUserEmail}). Please sign in with the correct account.`);
        await signOut({ redirect: false }); // Sign out mismatched account
        return;
      }

      // Send OAuth credentials to backend for validation
      const response = await fetch(`${API_BASE_URL}/api/user/oauth-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: oauthUser.email,
          name: oauthUser.name,
          provider: sessionData.provider || 'oauth',
          oauthId: oauthUser.id
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Store authentication data in localStorage
        const authData = {
          token: userData.token,
          userId: userData.data.userId,
          email: userData.data.email,
          name: userData.data.name,
          provider: userData.data.provider,
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        // Determine next steps (onboarding or dashboard)
        await handleSuccessfulAuth(userData);
      } else {
        // Handle backend validation failure
        const errorData = await response.json();
        setError(errorData.error || "OAuth authentication failed");
        await signOut({ redirect: false }); // Clean up session
      }
    } catch (error) {
      setError("Authentication failed. Please try again.");
      await signOut({ redirect: false });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiates OAuth login flow
   * @param {string} provider - Authentication provider (google/linkedin)
   */
  const handleOAuthLogin = async (provider) => {
    setIsLoading(true);
    setError(""); // Clear previous errors

    try {
      // Initiate NextAuth signIn flow
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: window.location.href,
      });

      if (result?.error) {
        setError(`${provider} authentication failed. Please try again.`);
      }
      // Successful authentication is handled by the session useEffect
    } catch (error) {
      setError(`${provider} authentication error. Please try again.`);
      setIsLoading(false);
    }
  };

  /**
   * Handles email/password login
   * Steps:
   * 1. Validate inputs
   * 2. Authenticate with backend
   * 3. Store token in localStorage
   * 4. Determine next steps (onboarding/dashboard)
   */
  const handleSignIn = async () => {
    setError(""); // Reset error state

    // Input validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      // Send credentials to backend
      const response = await fetch(`${API_BASE_URL}/api/user/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const userData = await response.json();

      if (response.ok && userData.success) {
        // Update localStorage with authentication data
        const authData = {
          token: userData.token,
          userId: userData.data.userId,
          email: userData.data.email,
          name: userData.data.name,
          provider: userData.data.provider,
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        // Determine next steps (onboarding or dashboard)
        await handleSuccessfulAuth(userData);
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          setError("Invalid email or password");
        } else if (response.status === 400 && userData.error?.includes('created with')) {
          setError(userData.error); // Provider-specific error
        } else {
          setError(userData.error || "Sign in failed. Please try again.");
        }
      }
    } catch (error) {
      // Network error handling
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  /**
   * Handles new account creation
   * Steps:
   * 1. Validate inputs
   * 2. Create account via backend
   * 3. Store token in localStorage
   * 4. Initiate onboarding flow
   */
  const handleSignUp = async () => {
    setError(""); // Reset error state

    // Input validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Create new account through backend
      const response = await fetch(`${API_BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          name: email.split('@')[0] // Generate default username from email
        }),
      });

      const userData = await response.json();

      if (response.ok && userData.success) {
        // Create credentials session
        await signIn('credentials', {
          email,
          password,
          callbackUrl: '/onboarding/signup',
          redirect: false
        });

        // Store authentication data
        const authData = {
          token: userData.token,
          userId: userData.data.userId,
          email: userData.data.email,
          name: userData.data.name,
          provider: null,
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        // New users always go through onboarding
        const mockSession = {
          user: {
            name: userData.data.name,
            email: userData.data.email,
            id: userData.data.userId
          }
        };

        // Trigger onboarding with new user flag
        onSuccess(mockSession, true);
        onClose();
      } else {
        // Handle account conflict
        if (response.status === 409) {
          setError("An account with this email already exists. Please sign in instead.");
          setIsLogin(true); // Switch to login mode
        } else {
          setError(userData.error || "Sign up failed. Please try again.");
        }
      }
    } catch (error) {
      // Network error handling
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  /**
   * Determines post-authentication flow
   * Checks:
   * 1. Verify authentication token
   * 2. Check if user completed onboarding
   * 3. Redirect to dashboard or onboarding
   */
  const handleSuccessfulAuth = async (userData) => {
    try {
      // Retrieve stored auth token
      const authData = JSON.parse(localStorage.getItem("authData"));
      
      // Verify token and get user details
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authData.token}` },
      });

      if (response.ok) {
        const userDetails = await response.json();
        
        // Check if user has completed onboarding
        const hasCompleteProfile = userDetails.data?.profile && userDetails.data?.subscription;

        if (hasCompleteProfile) {
          // Redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
          onClose();
        } else {
          // Trigger onboarding flow
          const mockSession = {
            user: {
              name: userData.data.name,
              email: userData.data.email,
              id: userData.data.userId,
              provider: userData.data.provider
            }
          };
          onSuccess(mockSession, false); // Existing user needing onboarding
          onClose();
        }
      } else if (response.status === 401) {
        // Handle expired/invalid token
        localStorage.removeItem("authData");
        setError("Authentication expired. Please try signing in again.");
      } else {
        setError("Failed to verify user status. Please try again.");
      }
    } catch (error) {
      setError("Failed to verify user status. Please try again.");
    }
  };

  /**
   * Handles form submission
   * Routes to appropriate handler based on auth mode
   */
  const handleSubmit = async () => {
    if (isLoading) return; // Prevent duplicate submissions
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await handleSignIn();
      } else {
        await handleSignUp();
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles Enter key press in form fields
   * Triggers form submission
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  // ===== Component Render ===== //
  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {}} // Disable close functionality
    >
      <DialogContent className="sm:max-w-[420px] rounded-xl border-0 shadow-2xl bg-white">
        {/* Modal Header */}
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold text-center text-[#002147]">
            {hasExistingData ? "Welcome Back" : (isLogin ? "Welcome Back" : "Create Account")}
          </DialogTitle>
          {hasExistingData && existingUserEmail && (
            <p className="text-sm text-gray-600 text-center">
              Sign in as {existingUserEmail}
            </p>
          )}
          {hasExistingData && (
            <p className="text-xs text-blue-600 text-center">
              You can sign in with Google/LinkedIn if you use the same email
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* OAuth Social Login Section */}
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <Button
              onClick={() => handleOAuthLogin("google")}
              variant="outline"
              className="w-full h-11 text-sm font-medium border-2 border-gray-200 hover:border-[#3598FE] hover:bg-gray-50 transition-all duration-300 hover:shadow-md rounded-lg"
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  {/* Google logo SVG paths */}
                </svg>
                <span className="text-[#002147]">
                  {isLoading ? "Connecting..." : "Continue with Google"}
                </span>
              </div>
            </Button>

            {/* LinkedIn OAuth Button */}
            <Button
              onClick={() => handleOAuthLogin("linkedin")}
              variant="outline"
              className="w-full h-11 text-sm font-medium border-2 border-gray-200 hover:border-[#3598FE] hover:bg-gray-50 transition-all duration-300 hover:shadow-md rounded-lg"
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="#0077B5" viewBox="0 0 24 24">
                  {/* LinkedIn logo SVG path */}
                </svg>
                <span className="text-[#002147]">
                  {isLoading ? "Connecting..." : "Continue with LinkedIn"}
                </span>
              </div>
            </Button>
          </div>

          {/* Divider Section */}
          <div className="relative">
            <Separator className="bg-gray-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">or</span>
            </div>
          </div>

          {/* Email/Password Form Section */}
          <div className="space-y-4">
            {/* Email Input Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#002147]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={hasExistingData && existingUserEmail ? existingUserEmail : "Enter your email"}
                required
                disabled={hasExistingData} // Disable if existing user
                className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400 disabled:bg-gray-50"
              />
            </div>

            {/* Password Input Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#002147]">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                required
                className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400"
              />
            </div>

            {/* Confirm Password Field - Only for signup */}
            {!isLogin && !hasExistingData && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#002147]">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm your password"
                  required
                  className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400"
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full h-11 bg-[#002147] hover:bg-[#001a38] text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Please wait...
                </div>
              ) : hasExistingData ? (
                "Sign In"
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </div>

          {/* Toggle Between Login/Signup - Only show if no existing data */}
          {!hasExistingData && (
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="text-sm text-gray-600 hover:text-[#002147] transition-colors duration-200"
                disabled={isLoading}
              >
                {isLogin ? (
                  <>
                    Don't have an account?{" "}
                    <span className="font-medium text-[#3598FE] hover:text-[#2577d6]">
                      Sign up
                    </span>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <span className="font-medium text-[#3598FE] hover:text-[#2577d6]">
                      Sign in
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};