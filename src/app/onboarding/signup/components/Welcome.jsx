import { Button } from "@/components/ui/button";

export const WelcomeStep = ({ onNext }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-10 animate-fade-in">
        <div className="space-y-6 -mt-16">
          <h1 className="text-6xl font-bold text-[#002147] leading-tight">
            Let's Find Your Perfect University
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            We'll personalize your experience to find the best universities that match your goals, 
            interests, and academic profile. This will take about 2 minutes.
          </p>
        </div>
         
        <div className="rounded-2xl p-8 ">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-[#002147] rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg">
                1
              </div>
              <p className="text-sm font-medium text-gray-700">Countries</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-[#002147] rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <p className="text-sm font-medium text-gray-700">Courses</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-[#002147] rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg">
                3
              </div>
              <p className="text-sm font-medium text-gray-700">Study Level</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-[#002147] rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg">
                4
              </div>
              <p className="text-sm font-medium text-gray-700">Profile</p>
            </div>
          </div>
           
          <Button
            onClick={onNext}
            size="lg"
            className="w-full bg-[#002147] hover:bg-[#003366] text-white py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Let's Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};