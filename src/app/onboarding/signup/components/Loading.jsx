import { useEffect, useState, useRef } from "react";

/**
 * LoadingStep component - Handles the profile submission and loading visualization
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.userData - User data collected during onboarding
 * @param {Function} props.onComplete - Callback invoked when submission completes
 * @returns {JSX.Element} Loading interface with progress visualization
 */
export const LoadingStep = ({ userData, onComplete }) => {
  // State management
  const [progress, setProgress] = useState(0);              // Progress percentage (0-100)
  const [currentMessage, setCurrentMessage] = useState(0);   // Index of current loading message
  const [isSubmitting, setIsSubmitting] = useState(false);   // API submission status
  const [submitError, setSubmitError] = useState(null);      // Submission error message
  const [isComplete, setIsComplete] = useState(false);      // Completion status
  const [dots, setDots] = useState("");                     // Animated dots for loading text

  // Ref to prevent duplicate submissions
  const hasSubmittedRef = useRef(false);

  // Loading messages displayed during the process
  const messages = [
    "Analyzing your preferences",
    "Matching you with universities",
    "Calculating compatibility scores",
    "Processing information",
    "Preparing your recommendations",
    "Almost ready",
  ];

  // Retrieve authentication token from localStorage
  const authData = typeof window !== "undefined" 
    ? localStorage.getItem("authData") 
    : null;
  const token = authData ? JSON.parse(authData).token : null;

  // ================================================================
  // ANIMATION EFFECTS
  // ================================================================

  /**
   * Animated dots effect for loading indicators
   * Cycles through "...", "..", ".", "" every 500ms
   */
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev === "..." ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  /**
   * Progress animation and message rotation
   * - Progress increases by 4% every 100ms until 100%
   * - Messages rotate every 1500ms
   */
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

  // ================================================================
  // DATA SUBMISSION LOGIC
  // ================================================================

  /**
   * Prepares user data for submission with fallbacks
   * 
   * Security Note: Masks credit card details before sending to backend
   * 
   * @returns {Object} Structured submission payload
   */
  const prepareSubmissionData = () => ({
    preferences: {
      countries: userData?.countries || [],  // Fallback: empty array
      courses: userData?.courses || [],      // Fallback: empty array
      studyLevel: userData?.studyLevel || "", // Fallback: empty string
    },
    academicInfo: userData?.academicInfo || {}, // Fallback: empty object
    paymentInfo: {
      name: userData?.paymentInfo?.name || "",
      email: userData?.paymentInfo?.email || "",
      // Mask card number: show only last 4 digits
      cardNumber: userData?.paymentInfo?.cardNumber
        ? "****" + userData.paymentInfo.cardNumber.slice(-4)
        : "",
    },
  });

  /**
   * Submits user data to backend API
   * 
   * Security Features:
   * - Uses JWT token from localStorage for authorization
   * - Implements credentials: "include" for cookie handling
   * - Handles token refresh by updating localStorage
   * 
   * Error Handling:
   * - Catches network errors (e.g., backend unreachable)
   * - Handles API error responses
   * - Provides user-friendly error messages
   */
  const submitData = async () => {
    // Prevent duplicate submissions
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = prepareSubmissionData();
      
      // Get API base URL with fallback to localhost
      const API_BASE_URL = 
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(
        `${API_BASE_URL}/api/user/complete-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Required for JSON payloads
            Authorization: `Bearer ${token}`,    // JWT authentication
          },
          credentials: "include",                // Include cookies in request
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      // Handle successful response
      if (response.ok && data.success !== false) {
        setIsComplete(true);

        // Update auth token if new one provided
        if (data.token) {
          try {
            const authData = {
              token: data.token,
              userId: data.data.userId,
              name: data.data.name,
              email: data.data.email,
            };
            localStorage.setItem("authData", JSON.stringify(authData));
            console.log("✅ Token saved to localStorage");
          } catch (error) {
            console.warn("⚠️ Could not save token to localStorage:", error);
          }
        }

        // Trigger completion callback after delay
        if (onComplete) setTimeout(() => onComplete(data), 2000);
      } 
      // Handle API errors
      else {
        throw new Error(data?.message || "Submission failed");
      }
    } catch (error) {
      // Reset submission lock on error
      hasSubmittedRef.current = false;
      
      let errorMessage = "Failed to submit data. Please try again.";
      
      // Detect network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Network error: Could not reach server. Check if backend is running.";
      } else {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Retry handler for failed submissions */
  const handleRetry = () => {
    hasSubmittedRef.current = false;
    setSubmitError(null);
    submitData();
  };

  // ================================================================
  // SUBMISSION TRIGGER
  // ================================================================

  /**
   * Auto-submit when progress reaches 100%
   * Conditions:
   * - Progress is 100%
   * - Not currently submitting
   * - No existing errors
   * - Haven't already submitted
   */
  useEffect(() => {
    if (progress === 100 && !isSubmitting && !submitError && !hasSubmittedRef.current) {
      const submitTimer = setTimeout(submitData, 1000);
      return () => clearTimeout(submitTimer);
    }
  }, [progress, isSubmitting, submitError]);

  // ================================================================
  // RENDER COMPONENT
  // ================================================================
  
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Main Content */}
        <div className="text-center space-y-8">
          {/* Spinner */}
          <div className="space-y-6">
            <div className="relative">
              <div className="w-32 h-32 mx-auto rounded-full bg-[#002147] flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <span className="text-4xl">🎓</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-[#002147]">
              Building Your Profile
            </h1>

            {/* Dynamic message with animated dots */}
            <div className="text-xl text-gray-600 min-h-[28px]">
              {isSubmitting ? (
                <span className="inline-flex items-center">
                  Submitting your profile
                  <span className="inline-block w-8 text-left">{dots}</span>
                </span>
              ) : isComplete ? (
                <span className="inline-flex items-center text-green-600">
                  <span className="mr-2 text-2xl animate-bounce">⏳</span>
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
                  className="bg-[#002147] h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  {/* Loading shimmer effect */}
                  {(isSubmitting || progress < 100) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <p className="text-lg font-medium text-gray-700">
                  {progress}% Complete
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
                      : progress >= 100 || isSubmitting
                      ? "⟳"
                      : "⏳"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {isSubmitting ? "Submitting" : "Matching"}
                </p>
              </div>
            </div>

            {/* Error Display */}
            {submitError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm mb-3">❌ {submitError}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Success Display */}
            {isComplete && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-600 text-sm">
                    ✅ Profile created successfully!
                  </span>
                  <span className="text-2xl animate-bounce">⏳</span>
                </div>
                <p className="text-green-600 text-sm mt-2 text-center">
                  Redirecting to dashboard
                  <span className="inline-block w-8 text-left font-mono">
                    {dots}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};