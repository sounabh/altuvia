"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Loading Skeleton Component
const AuthLoadingSkeleton = () => (
  <div className="space-y-5 py-2 animate-pulse">
    {/* Social Buttons Skeleton */}
    <div className="space-y-3">
      <div className="w-full h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"></div>
      <div className="w-full h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"></div>
    </div>

    {/* Divider */}
    <div className="relative">
      <Separator className="bg-gray-200" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="bg-white px-3 text-sm text-gray-400">or</span>
      </div>
    </div>

    {/* Form Fields Skeleton */}
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-11 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg"></div>
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-11 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg"></div>
      </div>

      <div className="h-11 bg-gradient-to-r from-[#002147] via-[#003366] to-[#002147] rounded-lg"></div>
    </div>

    {/* Toggle Text Skeleton */}
    <div className="flex justify-center gap-2">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
      <div className="h-4 bg-gray-300 rounded w-16"></div>
    </div>
  </div>
);

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasExistingData, setHasExistingData] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  const isTokenExpired = (authData) => {
    if (!authData.lastLogin) return true;
    const lastLogin = new Date(authData.lastLogin);
    const now = new Date();
    const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);
    return hoursSinceLogin > 24;
  };

  useEffect(() => {
    const checkExistingData = () => {
      try {
        const authData =
          typeof window !== "undefined"
            ? localStorage.getItem("authData")
            : null;

        if (authData) {
          const parsedData = JSON.parse(authData);

          if (parsedData.email) {
            setHasExistingData(true);
            setExistingUserEmail(parsedData.email);
            setEmail(parsedData.email);
            setIsLogin(true);
          }
        }
      } catch (error) {
        localStorage.removeItem("authData");
      } finally {
        setIsInitializing(false);
      }
    };

    checkExistingData();
  }, []);

  useEffect(() => {
    setError("");
  }, [isLogin]);

  useEffect(() => {
    if (session && session.user && !isLoading) {
      handleOAuthSuccess(session);
    }
  }, [session, isLoading]);

  const handleOAuthSuccess = async (sessionData) => {
    try {
      setIsLoading(true);
      const oauthUser = sessionData.user;

      if (hasExistingData && existingUserEmail !== oauthUser.email) {
        setError(
          `This ${sessionData.provider || "OAuth"} account (${
            oauthUser.email
          }) doesn't match your existing profile (${existingUserEmail}). Please sign in with the correct account.`
        );
        await signOut({ redirect: false });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/oauth-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: oauthUser.email,
          name: oauthUser.name,
          provider: sessionData.provider || "oauth",
        }),
      });

      if (response.ok) {
        const userData = await response.json();

        const authData = {
          token: userData.token,
          userId: userData.data.userId,
          email: userData.data.email,
          name: userData.data.name,
          provider: userData.data.provider,
          hasCompleteProfile: userData.data.hasCompleteProfile || false,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        await handleSuccessfulAuth(userData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "OAuth authentication failed");
        await signOut({ redirect: false });
      }
    } catch (error) {
      setError("Authentication failed. Please try again.");
      await signOut({ redirect: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: window.location.href,
      });

      if (result?.error) {
        setError(`${provider} authentication failed. Please try again.`);
        setIsLoading(false);
      }
    } catch (error) {
      setError(`${provider} authentication error. Please try again.`);
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError("");

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
      const response = await fetch(`${API_BASE_URL}/api/user/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const userData = await response.json();

      if (response.ok && userData.success) {
        const authData = {
          token: userData.token,
          userId: userData.data.userId,
          email: userData.data.email,
          name: userData.data.name,
          provider: userData.data.provider,
          hasCompleteProfile: userData.data.hasCompleteProfile || false,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        await handleSuccessfulAuth(userData);
      } else {
        if (response.status === 401) {
          setError("Invalid email or password");
        } else if (
          response.status === 400 &&
          userData.error?.includes("created with")
        ) {
          setError(userData.error);
        } else {
          setError(userData.error || "Sign in failed. Please try again.");
        }
      }
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError(
          "Cannot connect to server. Please check if the backend is running."
        );
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  const handleSignUp = async () => {
    setError("");

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
      const response = await fetch(`${API_BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: email.split("@")[0],
        }),
      });

      const userData = await response.json();

      if (response.ok && userData.success) {
        const authData = {
          token: userData.token,
          userId: userData.data.userId,
          email: userData.data.email,
          name: userData.data.name,
          provider: 'credentials',
          hasCompleteProfile: false,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        await signIn("credentials", {
          email,
          password,
          callbackUrl: "/onboarding/signup",
          redirect: false,
        });

        const mockSession = {
          user: {
            name: userData.data.name,
            email: userData.data.email,
            id: userData.data.userId,
          },
        };

        onSuccess(mockSession, true);
        onClose();
      } else {
        if (response.status === 409) {
          setError(
            "An account with this email already exists. Please sign in instead."
          );
          setIsLogin(true);
        } else {
          setError(userData.error || "Sign up failed. Please try again.");
        }
      }
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError(
          "Cannot connect to server. Please check if the backend is running."
        );
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  const handleSuccessfulAuth = async (userData) => {
    try {
      const authDataStr = localStorage.getItem("authData");
      if (!authDataStr) {
        setError("Authentication data not found. Please try again.");
        return;
      }

      const authData = JSON.parse(authDataStr);

      if (!isTokenExpired(authData)) {
        if (authData.hasCompleteProfile) {
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
          onClose();
          return;
        } else {
          const mockSession = {
            user: {
              name: userData.data.name,
              email: userData.data.email,
              id: userData.data.userId,
              provider: userData.data.provider,
            },
          };
          onSuccess(mockSession, false);
          onClose();
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authData.token}` },
      });

      if (response.ok) {
        const userDetails = await response.json();
        
        const updatedAuthData = {
          ...authData,
          hasCompleteProfile: userDetails.data.hasCompleteProfile || false,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(updatedAuthData));

        if (userDetails.data.hasCompleteProfile) {
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
          onClose();
        } else {
          const mockSession = {
            user: {
              name: userData.data.name,
              email: userData.data.email,
              id: userData.data.userId,
              provider: userData.data.provider,
            },
          };
          onSuccess(mockSession, false);
          onClose();
        }
      } else if (response.status === 401) {
        localStorage.removeItem("authData");
        setError("Session expired. Please sign in again.");
      } else {
        setError("Failed to verify user status. Please try again.");
      }
    } catch (error) {
      setError("Failed to verify user status. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit();
    }
  };

  if (isInitializing) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[420px] rounded-xl border-0 shadow-2xl bg-white">
          <DialogHeader className="space-y-3 pb-2">
            <DialogTitle className="text-2xl font-bold text-center text-[#002147]">
              Welcome
            </DialogTitle>
          </DialogHeader>
          <AuthLoadingSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {}}
    >
      <DialogContent className="sm:max-w-[420px] rounded-xl border-0 shadow-2xl bg-white">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold text-center text-[#002147]">
            {hasExistingData
              ? "Welcome Back"
              : isLogin
              ? "Welcome Back"
              : "Create Account"}
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => handleOAuthLogin("google")}
              variant="outline"
              className="w-full h-11 text-sm font-medium border-2 border-gray-200 hover:border-[#3598FE] hover:bg-gray-50 transition-all duration-300 hover:shadow-md rounded-lg"
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[#002147]">
                  {isLoading ? "Connecting..." : "Continue with Google"}
                </span>
              </div>
            </Button>

            <Button
              onClick={() => handleOAuthLogin("linkedin")}
              variant="outline"
              className="w-full h-11 text-sm font-medium border-2 border-gray-200 hover:border-[#3598FE] hover:bg-gray-50 transition-all duration-300 hover:shadow-md rounded-lg"
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="#0077B5" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-[#002147]">
                  {isLoading ? "Connecting..." : "Continue with LinkedIn"}
                </span>
              </div>
            </Button>
          </div>

          <div className="relative">
            <Separator className="bg-gray-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">or</span>
            </div>
          </div>

          <div className="space-y-4">
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
                onKeyPress={handleKeyPress}
                placeholder={
                  hasExistingData && existingUserEmail
                    ? existingUserEmail
                    : "Enter your email"
                }
                required
                disabled={hasExistingData}
                className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400 disabled:bg-gray-50"
              />
            </div>

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
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                required
                className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400"
              />
            </div>

            {!isLogin && !hasExistingData && (
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
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm your password"
                  required
                  className="h-11 border-2 border-gray-200 focus:border-[#002147] transition-colors bg-white rounded-lg text-[#002147] placeholder:text-gray-400"
                />
              </div>
            )}

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
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </div>

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