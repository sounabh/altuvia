"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/AuthForm";

export const AuthModal = memo(({ isOpen, onClose, onSuccess }) => {
  const { data: session } = useSession();

  const [isLogin, setIsLogin] = useState(true);//togle login/signup
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  //When modal opens or mode (login/signup) changes → clear previous error.
  useEffect(() => {
    if (isOpen) {
      setError("");
    }
  }, [isLogin, isOpen]);


  //oauthlogin

  const handleOAuthLogin = useCallback(async (provider) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");

    const toastId = toast.loading(`Connecting to ${provider}...`);

    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: window.location.href,
      });

      if (result?.error) {
        const errorMsg = `${provider} authentication failed. Please try again.`;
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
        setIsLoading(false);
      } else {
        toast.success(`${provider} authentication successful!`, { id: toastId });
        setTimeout(() => setIsLoading(false), 3000);
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      const errorMsg = `${provider} authentication error. Please try again.`;
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      setIsLoading(false);
    }
  }, [isLoading]);


  const handleFormSubmit = useCallback(async (error, formData) => {
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    
    const toastId = toast.loading(isLogin ? "Signing in..." : "Creating account...");

    //creds 
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        isSignup: !isLogin,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = result.error || "Authentication failed. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
        setIsLoading(false);
      } else {
        toast.success(
          isLogin ? "Welcome back!" : "Account created successfully!",
          { id: toastId }
        );
        setTimeout(() => setIsLoading(false), 3000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMsg = error.message || "Authentication failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      setIsLoading(false);
    }
  }, [isLoading, isLogin]);


  const handleToggleMode = useCallback(() => {
    setIsLogin(!isLogin);
    setError("");
  }, [isLogin]);

  
  //if user already there
  useEffect(() => {
    if (session?.user) {
      setIsLoading(false);
      onSuccess({ user: session.user });
      onClose();
    }
  }, [session?.user, onSuccess, onClose]);

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
});

AuthModal.displayName = "AuthModal";