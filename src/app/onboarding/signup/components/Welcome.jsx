import { Button } from "@/components/ui/button";

/**
 * WelcomeStep Component - Compact Single Page Design
 * 
 * This component serves as the introduction step after user authentication.
 * It provides a personalized welcome message and overview of the onboarding process.
 * 
 * @param {Function} onNext - Callback function to proceed to the next onboarding step
 * @param {Object} user - User object containing name and email from authentication
 */
export const WelcomeStep = ({ onNext, user }) => {
  
  /**
   * Extract the user's first name for personalized greeting
   * Handles various name formats and provides fallback
   */
  const getFirstName = () => {
    if (!user?.name) return "there";
    
    // Split full name and take first part
    const firstName = user.name.split(' ')[0];
    return firstName || "there";
  };

  /**
   * Handle the "Let's Get Started" button click
   * Safely calls the onNext callback if it exists
   */
  const handleGetStartedClick = () => {
   // console.log('🚀 Starting onboarding journey');
    
    if (typeof onNext === 'function') {
      onNext();
    }
  };

  return (
    <div className="h-full flex items-center justify-center overflow-hidden ">
      <div className="max-w-5xl mx-auto px-4 text-center">
        
        {/* Welcome Header Section - Reduced spacing */}
        <div className=" mb-6">
          {/* Personalized Greeting */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#002147] rounded-full mb-3">
              <span className="text-xl">👋</span>
            </div>
            
            <h2 className="text-2xl font-semibold text-[#002147] mb-1">
              Welcome, {getFirstName()}!
            </h2>
            
            <h1 className="text-3xl md:text-4xl font-bold text-[#002147] leading-tight mb-3 mt-3">
              Let's Personalize 
              <span className="block text-[#3598FE]">Your Journey</span>
            </h1>
          </div>

          {/* Description - More compact */}
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl mx-auto mt-4 mb-4">
            Tell us a bit about what you are looking for -- countries you are intrested in, subject's you like, your study plans and we'll tailor your experience to surface the most relevant opportunities.
          </p>
        </div>

        {/* Process Overview Section - Compact version */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-semibold text-[#002147] mb-6">
            Your Personalization Journey
          </h3>
          
          {/* Step Indicators Grid - Smaller and more compact */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            
            {/* Step 1 - Countries */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                  1
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#3598FE] rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-[#002147] text-sm">Countries</p>
                <p className="text-xs text-gray-500">Dream destinations</p>
              </div>
            </div>

            {/* Step 2 - Courses */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                  2
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#3598FE] rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-[#002147] text-sm">Courses</p>
                <p className="text-xs text-gray-500">Field of study</p>
              </div>
            </div>

            {/* Step 3 - Study Level */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                  3
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#3598FE] rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-[#002147] text-sm">Study Level</p>
                <p className="text-xs text-gray-500">Degree level</p>
              </div>
            </div>

            {/* Step 4 - Profile */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                  4
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#3598FE] rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-[#002147] text-sm">Profile</p>
                <p className="text-xs text-gray-500">Your information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Section - Compact */}
        <div className="space-y-3">
          {/* Main CTA Button */}
          <Button
            onClick={handleGetStartedClick}
            size="lg"
            className="w-full max-w-sm mx-auto bg-gradient-to-r from-[#002147] to-[#003366] hover:from-[#003366] hover:to-[#004080] text-white py-4 px-6 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center justify-center gap-2">
              Let's Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Button>

          {/* Estimated Time */}
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Takes about 1-2 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};