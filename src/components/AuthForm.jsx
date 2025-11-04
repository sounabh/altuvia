// ==========================================
// FILE: components/AuthForm.jsx
// COMPLETE - NO MISSING CODE
// ==========================================
import { useState, useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { OAuthButtons } from "./OAuthButtons";
import { validateEmail, validatePassword } from "@/lib/utils/auth";


export const AuthForm = memo(({
  onSubmit,
  onOAuthLogin,
  onToggleMode,
  isLogin,
  isLoading,
  error,
  hasExistingData,
  existingUserEmail,
}) => {
  const [email, setEmail] = useState(existingUserEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /**
   * Validation and submission
   */
  const handleSubmit = useCallback(() => {
    if (!email || !password) {
      onSubmit(new Error("Email and password are required"));
      return;
    }

    if (!validateEmail(email)) {
      onSubmit(new Error("Please enter a valid email address"));
      return;
    }

    if (!validatePassword(password)) {
      onSubmit(new Error("Password must be at least 6 characters long"));
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      onSubmit(new Error("Passwords do not match"));
      return;
    }

    onSubmit(null, { email, password, confirmPassword });
  }, [email, password, confirmPassword, isLogin, onSubmit]);

  /**
   * Keypress handler
   */
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit();
    }
  }, [handleSubmit, isLoading]);

  /**
   * Computed button text
   */
  const buttonText = useMemo(() => {
    if (isLoading) return null;
    if (hasExistingData) return "Sign In";
    return isLogin ? "Sign In" : "Create Account";
  }, [isLoading, hasExistingData, isLogin]);

  return (
    <div className="space-y-5 py-2">
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* OAuth Buttons */}
      <OAuthButtons onOAuthLogin={onOAuthLogin} isLoading={isLoading} />

      {/* Divider */}
      <div className="relative">
        <Separator className="bg-gray-200" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white px-3 text-sm text-gray-500">or</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <div className="space-y-4">
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

        {/* Confirm Password (Sign Up only) */}
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
          ) : (
            buttonText
          )}
        </Button>
      </div>

      {/* Toggle between Login and Sign Up */}
      {!hasExistingData && (
        <div className="text-center pt-2">
          <button
            onClick={onToggleMode}
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
  );
});

AuthForm.displayName = "AuthForm";