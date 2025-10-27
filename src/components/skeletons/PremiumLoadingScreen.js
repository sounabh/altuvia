/**
 * Premium Loading Screen Component
 * Provides an elegant loading experience with animated elements
 * @param {Object} props - Component properties
 * @param {string} props.message - Loading message to display
 * @returns {JSX.Element} Premium loading screen UI
 */
export const PremiumLoadingScreen = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="space-y-12">
          {/* Animated Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#002147] border-r-[#002147] animate-spin"></div>
              
              {/* Middle pulsing ring */}
              <div className="absolute inset-2 rounded-full border border-slate-200 animate-pulse"></div>
              
              {/* Inner static icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003d7a] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-[#002147]">
              {message === "Setting up your experience..." 
                ? "Setting up your account"
                : message === "Checking user status..."
                ? "Verifying credentials"
                : message === "Processing login..."
                ? "Authenticating"
                : message === "Initializing session..."
                ? "Initializing"
                : "Loading"}
            </h1>
            
            <p className="text-sm text-slate-600">
              {message === "Setting up your experience..." 
                ? "We're preparing everything for you"
                : message === "Checking user status..."
                ? "Please wait while we verify your account"
                : message === "Processing login..."
                ? "Connecting securely"
                : message === "Initializing session..."
                ? "Starting your session"
                : "Please wait"}
            </p>
          </div>

          {/* Progress indicator dots */}
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>

          {/* Subtle progress bar */}
          <div className="space-y-2">
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#002147] to-[#003d7a] rounded-full w-2/3 animate-pulse"></div>
            </div>
            <p className="text-xs text-slate-500 text-center">This may take a few seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Success Loading Screen Component
 * Shows when user is being redirected to dashboard
 * @returns {JSX.Element} Success loading screen UI
 */
export const SuccessLoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="space-y-12">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-[#002147]">
              Welcome back
            </h1>
            <p className="text-sm text-slate-600">
              Taking you to your dashboard
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};