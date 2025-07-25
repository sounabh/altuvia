import { useEffect, useState } from "react";

// ---------------------------------------------------------
// LoadingStep component simulates processing after form steps
// Shows a progress bar, animated messages, displays collected data, and logs data
// Props:
// - userData: all collected data from onboarding flow
// - user: authenticated user information
// ---------------------------------------------------------
export const LoadingStep = ({ userData = {}, user = null }) => {
  const [progress, setProgress] = useState(0);           // Tracks % completion
  const [currentMessage, setCurrentMessage] = useState(0); // Tracks rotating message index
  const [showDataSummary, setShowDataSummary] = useState(false); // Show data summary at 80%

  // Rotating messages shown below spinner
  const messages = [
    "Analyzing your preferences...",
    "Matching you with universities...",
    "Calculating compatibility scores...",
    "Processing information...",
    "Preparing your recommendations...",
    "Almost ready!"
  ];

  // Progress bar and rotating messages use intervals
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);

          // Show complete data summary and log data after completion
          setTimeout(() => {
            console.log("🎯 COMPLETE ONBOARDING DATA SUMMARY:", {
              user: user,
              preferences: {
                countries: userData.countries || [],
                courses: userData.courses || [],
                studyLevel: userData.studyLevel || "",
              },
              academicInfo: userData.academicInfo || {},
              paymentInfo: {
                name: userData.paymentInfo?.name || "",
                email: userData.paymentInfo?.email || "",
                cardNumber: userData.paymentInfo?.cardNumber ? "****" + userData.paymentInfo.cardNumber.slice(-4) : "",
                // Don't log sensitive payment details for security
              }
            });
          }, 1500);

          return 100;
        }

        // Show data summary when progress reaches 80%
        if (prev >= 80 && !showDataSummary) {
          setShowDataSummary(true);
        }

        return prev + 2; // Increase by 2% every 100ms (same as second version)
      });
    }, 100);

    // Rotate messages every 2s
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2000);

    // Clear intervals on unmount
    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [showDataSummary]); // Add showDataSummary to dependency array

  // Helper function to format array data
  const formatArrayData = (arr) => {
    if (!arr || arr.length === 0) return "None selected";
    return arr.join(", ");
  };

  // Helper function to format academic info
  const formatAcademicInfo = (academicInfo) => {
    if (!academicInfo || Object.keys(academicInfo).length === 0) {
      return "Not provided";
    }
    
    const entries = Object.entries(academicInfo);
    return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">

        {/* Animated Spinner Section */}
        <div className="space-y-6">
          <div className="relative">
            <div className="w-32 h-32 mx-auto rounded-full bg-[#002147] flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl">🎓</span>
              </div>
            </div>
          </div>

          {/* Title & Rotating Message */}
          <h1 className="text-4xl font-bold text-[#002147]">
            Building Your Profile
          </h1>

          <p className="text-xl text-gray-600 animate-fade-in">
            {messages[currentMessage]}
          </p>
        </div>

        {/* Progress Bar Section */}
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
            </p>
          </div>

          {/* Step Icons Summary */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {/* Preferences step */}
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-[#002147] rounded-full mx-auto flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-sm text-gray-600">Preferences</p>
            </div>

            {/* Profile step */}
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-[#002147] rounded-full mx-auto flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-sm text-gray-600">Profile</p>
            </div>

            {/* Matching step - conditionally complete */}
            <div className="text-center space-y-2">
              <div
                className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                  progress >= 100
                    ? "bg-[#002147]"
                    : "bg-blue-500 animate-pulse"
                }`}
              >
                <span className="text-white text-sm">
                  {progress >= 100 ? "✓" : "⏳"}
                </span>
              </div>
              <p className="text-sm text-gray-600">Matching</p>
            </div>
          </div>
        </div>

        {/* Data Summary Section - Show when progress >= 80% */}
        {showDataSummary && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-[#002147] mb-4">Your Profile Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* User Info */}
              {user && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800">User Information</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {user.name || user.email || "Not provided"}
                  </p>
                  {user.email && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                  )}
                </div>
              )}

              {/* Preferences */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Study Preferences</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Countries:</span> {formatArrayData(userData.countries)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Courses:</span> {formatArrayData(userData.courses)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Study Level:</span> {userData.studyLevel || "Not selected"}
                </p>
              </div>

              {/* Academic Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Academic Information</h3>
                <p className="text-sm text-gray-600">
                  {formatAcademicInfo(userData.academicInfo)}
                </p>
              </div>

              {/* Payment Info */}
              {userData.paymentInfo && Object.keys(userData.paymentInfo).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800">Payment Information</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {userData.paymentInfo.name || "Not provided"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {userData.paymentInfo.email || "Not provided"}
                  </p>
                  {userData.paymentInfo.cardNumber && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Card:</span> ****{userData.paymentInfo.cardNumber.slice(-4)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {progress >= 100 && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium text-center">
                  ✅ Profile Complete! Data has been logged to console.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};