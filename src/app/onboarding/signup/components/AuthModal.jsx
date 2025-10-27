"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/AuthForm";
import { API_BASE_URL } from "@/lib/constants/auth";

/**
 * Authentication Modal Component
 * Handles user authentication using NextAuth session
 */
export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { data: session, update } = useSession();

  // State management
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear error when switching between login/signup modes
  useEffect(() => {
    setError("");
  }, [isLogin]);

  /**
   * Initiates OAuth login flow
   */
  const handleOAuthLogin = async (provider) => {
    setIsLoading(true);
    setError("");

    try {
      //next auth trigger
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: window.location.href,
      });

      if (result?.error) {
        setError(`${provider} authentication failed. Please try again.`);
        setIsLoading(false);
      }
      // if Success then case handled by useEffect watching session
    } catch (error) {
      console.error('OAuth login error:', error);
      setError(`${provider} authentication error. Please try again.`);
      setIsLoading(false);
    }
  };

  /**
   * Handles email/password sign up
   */
  const handleSignUp = async (email, password) => {
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
        // Sign in with credentials to create NextAuth session
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.ok) {
          // Update session with backend data
          await update({
            token: userData.token,
            userId: userData.data.userId,
            hasCompleteProfile: userData.data.hasCompleteProfile || false,
            isNewUser: true,
          });

          // Trigger success callback for new user
          onSuccess({ user: userData.data }, true);
          onClose();
        } else {
          throw new Error("Failed to create session after signup");
        }
      } else {
        if (response.status === 409) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        } else {
          throw new Error(userData.error || "Sign up failed. Please try again.");
        }
      }
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Cannot connect to server. Please check if the backend is running.");
      } else {
        throw new Error(error.message || "Network error. Please try again.");
      }
    }
  };

  /**
   * Handles form submission
   */
  const handleFormSubmit = async (error, formData) => {
    if (error) {
      setError(error.message);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!isLogin) {
        await handleSignUp(formData.email, formData.password);
      }
      // Login handled by credentials provider automatically
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggles between login and signup modes
   */
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  // Watch session for OAuth success
  useEffect(() => {
    if (session?.user && !isLoading) {
      // Session established - check profile completion
      const hasCompleteProfile = session.hasCompleteProfile || false;
      
      onSuccess(
        { user: session.user }, 
        session.isNewUser || !hasCompleteProfile
      );
      onClose();
    }
  }, [session, isLoading, onSuccess, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[420px] rounded-xl border-0 shadow-2xl bg-white">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold text-center text-[#002147]">
            {isLogin ? "Welcome Back" : "Create Account"}
          </DialogTitle>
        </DialogHeader>

        <AuthForm
          onSubmit={handleFormSubmit}
          onOAuthLogin={handleOAuthLogin}
          onToggleMode={handleToggleMode}
          isLogin={isLogin}
          isLoading={isLoading}
          error={error}
          hasExistingData={false}
          existingUserEmail=""
        />
      </DialogContent>
    </Dialog>
  );
};