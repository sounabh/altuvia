import { useEffect, useState, useRef } from "react";

/**
 * LoadingStep component - Handles profile submission with improved localStorage management
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.userData - User data collected during onboarding
 * @param {Function} props.onComplete - Callback invoked when submission completes
 * @returns {JSX.Element} Loading interface with progress visualization
 */
export const LoadingStep = ({ userData, onComplete }) => {
  // State management
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [dots, setDots] = useState("");

  // Ref to prevent duplicate submissions
  const hasSubmittedRef = useRef(false);

  // Loading messages
  const messages = [
    "Analyzing your preferences",
    "Matching you with universities",
    "Calculating compatibility scores",
    "Processing information",
    "Preparing your recommendations",
    "Almost ready",
  ];

  /**
   * Get authentication token from localStorage with validation
   */
  const getAuthToken = () => {
    try {
      const authData = typeof window !== "undefined" 
        ? localStorage.getItem("authData") 
        : null;
      
      if (!authData) {
        console.warn("⚠️ No auth data found in localStorage");
        return null;
      }

      const parsedData = JSON.parse(authData);
      
      if (!parsedData.token) {
        console.warn("⚠️ No token found in auth data");
        return null;
      }

      return parsedData.token;
    } catch (error) {
      console.error("❌ Error parsing auth data:", error);
      return null;
    }
  };

  /**
   * Update localStorage with new token and profile completion flag
   */
  const updateAuthData = (newToken, additionalData = {}) => {
    try {
      const existingAuthStr = localStorage.getItem("authData");
      
      if (existingAuthStr) {
        const existingAuth = JSON.parse(existingAuthStr);
        const updatedAuth = {
          ...existingAuth,
          token: newToken || existingAuth.token,
          hasCompleteProfile: true, // Mark profile as complete
          lastLogin: new Date().toISOString(),
          ...additionalData
        };
        
        localStorage.setItem("authData", JSON.stringify(updatedAuth));
        console.log("✅ Updated localStorage with profile completion flag");
        return true;
      } else {
        console.warn("⚠️ No existing auth data to update");
        return false;
      }
    } catch (error) {
      console.error("❌ Error updating localStorage:", error);
      return false;
    }
  };

  // Animation effects
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev === "..." ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    let progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    let messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  /**
   * Prepare submission data with security considerations
   */
  const prepareSubmissionData = () => ({
    preferences: {
      countries: userData?.countries || [],
      courses: userData?.courses || [],
      studyLevel: userData?.studyLevel || "",
    },
    academicInfo: userData?.academicInfo || {},
    paymentInfo: {
      name: userData?.paymentInfo?.name || "",
      email: userData?.paymentInfo?.email || "",
      // Mask card number for security
      cardNumber: userData?.paymentInfo?.cardNumber
        ? "****" + userData.paymentInfo.cardNumber.slice(-4)
        : "",
    },
  });

  /**
   * Submit user data with improved error handling and localStorage management
   */
  const submitData = async () => {
    // Prevent duplicate submissions
    if (hasSubmittedRef.current) {
      console.log("⚠️ Submission already in progress, skipping...");
      return;
    }
    
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get fresh token
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Authentication token not found. Please sign in again.");
      }

      const payload = prepareSubmissionData();
      console.log("📤 Submitting profile data:", payload);
      
      const API_BASE_URL = 
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(
        `${API_BASE_URL}/api/user/complete-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("📥 Server response:", data);

      if (response.ok && data.success !== false) {
        setIsComplete(true);
        
        // Update localStorage with new token and completion flag
        if (data.token) {
          updateAuthData(data.token, {
            userId: data.data?.userId,
            name: data.data?.name,
            email: data.data?.email,
            provider: data.data?.provider
          });
        } else {
          // No new token provided, just update completion flag
          updateAuthData(null);
        }

        // Trigger completion callback after delay
        if (onComplete) {
          setTimeout(() => {
            onComplete(data);
          }, 2000);
        }
      } 
      else if (response.status === 401) {
        // Handle expired token
        localStorage.removeItem("authData");
        throw new Error("Your session has expired. Please sign in again.");
      }
      else if (response.status === 409 && data.userExists) {
        // Profile already completed - update localStorage and proceed
        console.log("✅ Profile already completed, updating localStorage");
        updateAuthData(data.token || getAuthToken());
        setIsComplete(true);
        
        if (onComplete) {
          setTimeout(() => {
            onComplete(data);
          }, 2000);
        }
      }
      else {
        throw new Error(data?.error || data?.message || "Profile submission failed");
      }
    } catch (error) {
      console.error("❌ Profile submission error:", error);
      
      // Reset submission lock on error
      hasSubmittedRef.current = false;
      
      let errorMessage = "Failed to submit profile. Please try again.";
      
      // Handle specific error types
      if (error.message.includes("Authentication token")) {
        errorMessage = error.message;
      } else if (error.message.includes("session has expired")) {
        errorMessage = error.message;
      } else if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Network error: Cannot reach server. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Retry handler for failed submissions
   */
  const handleRetry = () => {
    console.log("🔄 Retrying profile submission...");
    hasSubmittedRef.current = false;
    setSubmitError(null);
    setProgress(0);
    
    // Restart progress animation
    let progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);
  };

  /**
   * Auto-submit when progress reaches 100%
   */
  useEffect(() => {
    if (progress === 100 && !isSubmitting && !submitError && !hasSubmittedRef.current && !isComplete) {
      console.log("🚀 Progress complete, submitting data...");
      const submitTimer = setTimeout(submitData, 1000);
      return () => clearTimeout(submitTimer);
    }
  }, [progress, isSubmitting, submitError, isComplete]);

  // Token expiration handler
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setSubmitError("Authentication required. Please sign in again.");
    }
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-8">
          {/* Animated spinner */}
          <div className="space-y-6">
            <div className="relative">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-500 ${
                isComplete 
                  ? 'bg-green-600 animate-pulse' 
                  : submitError 
                    ? 'bg-red-600 animate-pulse' 
                    : 'bg-[#002147] animate-pulse'
              }`}>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <span className="text-4xl">
                    {isComplete ? '🎉' : submitError ? '⚠️' : '🎓'}
                  </span>
                </div>
              </div>
              
              {/* Loading ring animation */}
              {(isSubmitting && !isComplete) && (
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              )}
            </div>

            <h1 className={`text-4xl font-bold transition-colors duration-500 ${
              isComplete 
                ? 'text-green-600' 
                : submitError 
                  ? 'text-red-600' 
                  : 'text-[#002147]'
            }`}>
              {isComplete 
                ? 'Profile Complete!' 
                : submitError 
                  ? 'Submission Failed' 
                  : 'Building Your Profile'
              }
            </h1>

            {/* Dynamic message */}
            <div className="text-xl text-gray-600 min-h-[28px]">
              {submitError ? (
                <span className="text-red-600">
                  Please try again or contact support
                </span>
              ) : isSubmitting ? (
                <span className="inline-flex items-center">
                  Submitting your profile
                  <span className="inline-block w-8 text-left">{dots}</span>
                </span>
              ) : isComplete ? (
                <span className="inline-flex items-center text-green-600">
                  <span className="mr-2 text-2xl animate-bounce">🎊</span>
                  Redirecting to dashboard
                  <span className="inline-block w-8 text-left">{dots}</span>
                </span>
              ) : (
                <span>
                  {messages[currentMessage]}
                  <span className="inline-block w-8 text-left">{dots}</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden ${
                    isComplete 
                      ? 'bg-green-500' 
                      : submitError 
                        ? 'bg-red-500' 
                        : 'bg-[#002147]'
                  }`}
                  style={{ width: `${isComplete ? 100 : progress}%` }}
                >
                  {/* Shimmer effect */}
                  {(isSubmitting || (progress < 100 && !submitError)) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <p className={`text-lg font-medium transition-colors duration-500 ${
                  isComplete 
                    ? 'text-green-600' 
                    : submitError 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                }`}>
                  {isComplete ? '100% Complete' : `${progress}% Complete`}
                </p>
                {isSubmitting && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Step Icons */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-[#002147] rounded-full mx-auto flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-sm text-gray-600">Preferences</p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-[#002147] rounded-full mx-auto flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-sm text-gray-600">Profile</p>
              </div>

              <div className="text-center space-y-2">
                <div
                  className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-all duration-500 ${
                    isComplete
                      ? "bg-green-500"
                      : submitError
                        ? "bg-red-500"
                        : progress >= 100
                          ? "bg-[#002147]"
                          : isSubmitting
                            ? "bg-blue-500 animate-spin"
                            : "bg-blue-500 animate-pulse"
                  }`}
                >
                  <span className="text-white text-sm">
                    {isComplete
                      ? "✓"
                      : submitError
                        ? "✕"
                        : progress >= 100 || isSubmitting
                          ? "⟳"
                          : "⏳"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {isComplete 
                    ? "Complete!" 
                    : submitError 
                      ? "Failed" 
                      : isSubmitting 
                        ? "Submitting" 
                        : "Processing"
                  }
                </p>
              </div>
            </div>

            {/* Error Display */}
            {submitError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <span className="text-red-600 text-sm mr-2">❌</span>
                  <p className="text-red-600 text-sm font-medium">Submission Error</p>
                </div>
                <p className="text-red-600 text-sm mb-3">{submitError}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem("authData");
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Sign In Again
                  </button>
                </div>
              </div>
            )}

            {/* Success Display */}
            {isComplete && !submitError && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-green-600 text-sm">✅</span>
                  <span className="text-green-600 text-sm font-medium">
                    Profile created successfully!
                  </span>
                  <span className="text-2xl animate-bounce">🎊</span>
                </div>
                <p className="text-green-600 text-sm text-center">
                  Preparing your personalized dashboard
                  <span className="inline-block w-8 text-left font-mono">
                    {dots}
                  </span>
                </p>
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center space-x-2 text-xs text-green-700 bg-green-100 rounded-full px-3 py-1">
                    <span>🔒</span>
                    <span>Your data is secure and encrypted</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};