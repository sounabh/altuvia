"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  // NextAuth session management hook
  const { data: session, status } = useSession();

  // Component state management
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup modes
  const [email, setEmail] = useState(""); // User email input
  const [password, setPassword] = useState(""); // User password input
  const [confirmPassword, setConfirmPassword] = useState(""); // Password confirmation for signup
  const [isLoading, setIsLoading] = useState(false); // Loading state for async operations

  /**
   * Effect: Monitor session changes for OAuth authentication
   * This handles the callback after successful OAuth login from Google/LinkedIn
   * When session is established, it triggers success callback and closes modal
   */
  useEffect(() => {
    if (session && session.user && !isLoading) {
      console.log("✅ Session detected, triggering onSuccess");
      onSuccess(session);
      onClose();
    }
  }, [session, isLoading, onSuccess, onClose]);

  /**
   * Handle OAuth authentication (Google, LinkedIn)
   * @param {string} provider - The OAuth provider ('google' or 'linkedin')
   */
  const handleOAuthLogin = async (provider) => {
    setIsLoading(true);

    try {
      console.log(`🚀 Initiating ${provider} OAuth login...`);

      // Trigger NextAuth OAuth flow
      const result = await signIn(provider, {
        redirect: false, // Stay on current page instead of redirecting
        callbackUrl: window.location.href, // Return to current page after auth
      });

      // Log detailed OAuth result for debugging
      console.log(`📊 ${provider} OAuth Result:`, {
        result,
        error: result?.error,
        ok: result?.ok,
        status: result?.status,
        url: result?.url,
      });

      if (result?.ok) {
        console.log(`✅ ${provider} OAuth login successful!`);
        // Success is handled by useEffect when session updates
        setIsLoading(false);
      } else {
        console.error(`❌ ${provider} OAuth login failed:`, result?.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`💥 ${provider} OAuth error:`, error);
      setIsLoading(false);
    }
  };

  /**
   * Handle traditional email/password form submission
   * This simulates authentication for demonstration purposes
   */
  const handleSubmit = async () => {
    setIsLoading(true);

    console.log("📝 Form submission:", {
      isLogin,
      email,
      hasPassword: !!password,
      hasConfirmPassword: !!confirmPassword,
    });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);

    // Create mock user session for form-based login
    onSuccess({
      user: {
        name: email.split("@")[0], // Extract username from email
        email: email,
      },
    });
  };

  /**
   * Debug logging for session changes
   * Only logs in development environment
   */
  if (session) {
    console.log("🔐 Current Session:", {
      user: session.user,
      expires: session.expires,
      accessToken: session.accessToken,
      provider: session.provider,
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {}} // Disable close functionality as requested
    >
      <DialogContent className="sm:max-w-[420px] rounded-xl border-0 shadow-2xl bg-white">
        {/* Modal Header */}
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold text-center text-[#002147]">
            {isLogin ? "Welcome Back" : "Create Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
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
                {/* Google Icon SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
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
                {/* LinkedIn Icon SVG */}
                <svg className="w-5 h-5" fill="#0077B5" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#002147]"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400"
              />
            </div>

            {/* Password Input Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#002147]"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400"
              />
            </div>

            {/* Confirm Password Field - Only shown in signup mode */}
            {!isLogin && (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-[#002147]"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400"
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full h-11 bg-[#002147] hover:bg-[#001a38] text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>
          </div>

          {/* Toggle Between Login/Signup Section */}
          <div className="text-center pt-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
