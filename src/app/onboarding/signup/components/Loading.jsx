import { useEffect, useState, useRef } from "react";

export const LoadingStep = ({ userData, user, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const hasSubmittedRef = useRef(false);

  const messages = [
    "Analyzing your preferences...",
    "Matching you with universities...",
    "Calculating compatibility scores...",
    "Processing information...",
    "Preparing your recommendations...",
    "Almost ready!"
  ];

  // Prepare data for submission
  const prepareSubmissionData = () => {
    return {
      user: user,
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
      }
    };
  };

  // Submit data to backend
  const submitData = async () => {
    if (hasSubmittedRef.current) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    hasSubmittedRef.current = true;
    
    try {
      const payload = prepareSubmissionData();
      
      // Use your actual API base URL here - replace with your backend URL
 const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'; // or your production URL
      
      const response = await fetch(`${API_BASE_URL}/api/user/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        setIsComplete(true);
        
        // Save token to localStorage (Note: This won't work in Claude artifacts)
        if (data.token) {
          try {
            localStorage.setItem('authToken', data.token);
            console.log('✅ Token saved to localStorage');
          } catch (error) {
            console.warn('⚠️ Could not save token to localStorage:', error);
          }
        }
        
        // Complete the onboarding after a delay
        if (onComplete && typeof onComplete === 'function') {
          setTimeout(() => {
            onComplete(data); // Pass the response data including token
          }, 2000);
        }
      } else {
        throw new Error(data?.message || "Submission failed");
      }
    } catch (error) {
      hasSubmittedRef.current = false;
      
      let errorMessage = "Failed to submit data. Please try again.";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Network error: Could not reach server. Check if backend is running.";
      } else {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    hasSubmittedRef.current = false;
    setSubmitError(null);
    submitData();
  };

  // Progress animation
  useEffect(() => {
    let progressInterval;
    let messageInterval;

    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(messageInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  // Submit when progress complete
  useEffect(() => {
    if (progress === 100 && !isSubmitting && !submitError && !hasSubmittedRef.current) {
      const submitTimer = setTimeout(() => {
        submitData();
      }, 1000);
      
      return () => clearTimeout(submitTimer);
    }
  }, [progress, isSubmitting, submitError]);

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

            <p className="text-xl text-gray-600">
              {messages[currentMessage]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-[#002147] h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-lg font-medium text-gray-700">
                {progress}% Complete
                {isSubmitting && " - Submitting your profile..."}
              </p>
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
                  className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                    isComplete
                      ? "bg-green-500"
                      : progress >= 100
                      ? "bg-[#002147]"
                      : "bg-blue-500 animate-pulse"
                  }`}
                >
                  <span className="text-white text-sm">
                    {isComplete ? "✓" : progress >= 100 ? "✓" : "⏳"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Matching</p>
              </div>
            </div>

         

            {/* Success Display */}
            {isComplete && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">
                  ✅ Profile created successfully! Redirecting to dashboard in a moment...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};