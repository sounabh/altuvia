import { useEffect, useState, useRef } from "react";

/**
 * LoadingStep component - Handles profile submission with premium UI/UX
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.userData - User data collected during onboarding
 * @param {Function} props.onComplete - Callback invoked when submission completes
 * @returns {JSX.Element} Premium loading interface
 */
export const LoadingStep = ({ userData, onComplete }) => {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [phase, setPhase] = useState("processing");

  // Ref to prevent duplicate submissions
  const hasSubmittedRef = useRef(false);

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
          hasCompleteProfile: true,
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
      cardNumber: userData?.paymentInfo?.cardNumber
        ? "****" + userData.paymentInfo.cardNumber.slice(-4)
        : "",
    },
  });

  /**
   * Submit user data with improved error handling
   */
  const submitData = async () => {
    if (hasSubmittedRef.current) {
      console.log("⚠️ Submission already in progress, skipping...");
      return;
    }
    
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setPhase("submitting");
    setSubmitError(null);

    try {
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
        if (data.token) {
          updateAuthData(data.token, {
            userId: data.data?.userId,
            name: data.data?.name,
            email: data.data?.email,
            provider: data.data?.provider
          });
        } else {
          updateAuthData(null);
        }

        setPhase("complete");
        setIsComplete(true);

        if (onComplete) {
          setTimeout(() => {
            onComplete(data);
          }, 2000);
        }
      } 
      else if (response.status === 401) {
        localStorage.removeItem("authData");
        throw new Error("Your session has expired. Please sign in again.");
      }
      else if (response.status === 409 && data.userExists) {
        console.log("✅ Profile already completed, updating localStorage");
        updateAuthData(data.token || getAuthToken());
        setPhase("complete");
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
      
      hasSubmittedRef.current = false;
      
      let errorMessage = "Failed to submit profile. Please try again.";
      
      if (error.message.includes("Authentication token")) {
        errorMessage = error.message;
      } else if (error.message.includes("session has expired")) {
        errorMessage = error.message;
      } else if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Network error: Cannot reach server. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPhase("error");
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
    setPhase("processing");
    setIsSubmitting(false);
  };

  /**
   * Auto-submit when component mounts
   */
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setPhase("error");
      setSubmitError("Authentication required. Please sign in again.");
    } else if (!hasSubmittedRef.current && !isComplete) {
      const submitTimer = setTimeout(submitData, 800);
      return () => clearTimeout(submitTimer);
    }
  }, []);

  // Processing phase - Initial loading
  if (phase === "processing" && !isSubmitting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center space-y-12">
            {/* Animated Icon */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-[#002147] to-[#003d7a] rounded-2xl animate-pulse"></div>
              <div className="absolute inset-1 bg-white rounded-2xl flex items-center justify-center">
                <svg className="w-12 h-12 text-[#002147]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[#002147]">
                Finalizing your profile
              </h1>
              <p className="text-slate-600 text-sm">
                We're preparing your personalized experience
              </p>
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-3 h-3 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-3 h-3 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Submitting phase - Data being sent
  if (phase === "submitting" || isSubmitting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center space-y-12">
            {/* Animated Spinner */}
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 text-[#002147] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-[#002147]">...</span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[#002147]">
                Setting up your dashboard
              </h1>
              <p className="text-slate-600 text-sm">
                Please wait while we process your information
              </p>
            </div>

            {/* Progress indicator */}
            <div className="space-y-3">
              <div className="h-1 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#002147] to-[#003d7a] rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-xs text-slate-500">Almost there...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete phase - Success
  if (phase === "complete" || isComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center space-y-12">
            {/* Success Icon */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl animate-pulse"></div>
              <div className="absolute inset-1 bg-white rounded-2xl flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-emerald-600">
                All set!
              </h1>
              <p className="text-slate-600 text-sm">
                Your profile has been created successfully
              </p>
            </div>

            {/* Loading indicator */}
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
            </div>

            {/* Status text */}
            <p className="text-sm text-slate-600">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error phase
  if (phase === "error") {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center space-y-8">
            {/* Error Icon */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl"></div>
              <div className="absolute inset-1 bg-white rounded-2xl flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-red-600">
                Something went wrong
              </h1>
              <p className="text-slate-600 text-sm">
                {submitError || "We encountered an issue processing your profile"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-[#002147] text-white font-semibold rounded-lg hover:bg-[#001a38] transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("authData");
                  window.location.href = "/";
                }}
                className="w-full py-3 bg-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-400 transition-all duration-300 shadow-md"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};