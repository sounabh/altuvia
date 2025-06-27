import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Use App Router navigation

// ---------------------------------------------------------
// LoadingStep component simulates processing after form steps
// Shows a progress bar, animated messages, and redirects to dashboard
// ---------------------------------------------------------
export const LoadingStep = () => {
  const [progress, setProgress] = useState(0);           // Tracks % completion
  const [currentMessage, setCurrentMessage] = useState(0); // Tracks rotating message index
  const router = useRouter(); // Initialize router for navigation

  // Rotating messages shown below spinner
  const messages = [
    "Analyzing your preferences...",
    "Matching you with universities...",
    "Calculating compatibility scores...",
    "Preparing your recommendations...",
    "Almost ready!"
  ];

  // Progress bar and rotating messages use intervals
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);

          // Redirect to dashboard after completion
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);

          return 100;
        }

        return prev + 2; // Increase by 2% every 100ms
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
  }, [router]); // Add router to dependency array

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">

        {/* Animated Spinner Section */}
        <div className="space-y-6">
          <div className="relative">
            <div className="w-32 h-32 mx-auto rounded-full bg-[#002147] flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl">🎓</span>
              </div>
            </div>

            {/* Spinning Border */}
         
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

      </div>
    </div>
  );
};