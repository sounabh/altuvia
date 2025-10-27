import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { OAuthButtons } from "./OAuthButtons";
import { validateEmail, validatePassword } from "@/lib/utils/auth";

/**
 * Authentication Form Component
 * Handles both login and signup functionality with email/password
 * Supports OAuth authentication and form validation
 * 
 
 */

export const AuthForm = ({
  onSubmit,
  onOAuthLogin,
  onToggleMode,
  isLogin,
  isLoading,
  error,
  hasExistingData,
  existingUserEmail,
}) => {
  // State for form fields
  const [email, setEmail] = useState(existingUserEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /**
   * Handles form validation and submission
   * Validates email format, password requirements, and password confirmation
   * Calls onSubmit callback with error or form data
   */
  const handleSubmit = () => {
    // Validate required fields
    if (!email || !password) {
      onSubmit(new Error("Email and password are required"));
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      onSubmit(new Error("Please enter a valid email address"));
      return;
    }

    // Validate password length
    if (!validatePassword(password)) {
      onSubmit(new Error("Password must be at least 6 characters long"));
      return;
    }

    // Validate password confirmation for signup
    if (!isLogin && password !== confirmPassword) {
      onSubmit(new Error("Passwords do not match"));
      return;
    }

    // Submit form data if all validations pass
    onSubmit(null, { email, password, confirmPassword });
  };

  /**
   * Handles keyboard events for form submission
   * Submits form when Enter key is pressed and not loading
   * 
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-5 py-2">
      {/* Error message display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* OAuth authentication buttons */}
      <OAuthButtons onOAuthLogin={onOAuthLogin} isLoading={isLoading} />

      {/* Divider between OAuth and email/password form */}
      <div className="relative">
        <Separator className="bg-gray-200" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white px-3 text-sm text-gray-500">or</span>
        </div>
      </div>

      {/* Email and password form section */}
      <div className="space-y-4">
        {/* Email input field */}
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

        {/* Password input field */}
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

        {/* Confirm password field (only for signup) */}
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

        {/* Form submission button */}
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

      {/* Toggle between login and signup modes */}
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
};