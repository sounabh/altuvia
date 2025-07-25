import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// -----------------------------------------------------------------------------
// List of study levels with metadata
// -----------------------------------------------------------------------------
const studyLevels = [
  {
    id: "undergraduate",
    title: "Undergraduate",
    subtitle: "Bachelor's degree programs",
    icon: "🎓",
    description: "3-4 year degree programs"
  },
  {
    id: "masters",
    title: "Master's",
    subtitle: "Graduate degree programs",
    icon: "📚",
    description: "1-2 year advanced programs"
  },
  {
    id: "mba",
    title: "MBA",
    subtitle: "Master of Business Administration",
    icon: "💼",
    description: "Business leadership program"
  },
  {
    id: "phd",
    title: "PhD",
    subtitle: "Doctoral degree programs",
    icon: "🔬",
    description: "Research-focused programs"
  }
];

// -----------------------------------------------------------------------------
// StudyLevelStep Component
// Props:
// - selectedLevel: the currently selected study level
// - onNext: function to go to the next step
// - onBack: function to go back to the previous step
// - onUpdate: function to update the selected level
// -----------------------------------------------------------------------------
export const StudyLevelStep = ({ 
  selectedLevel = null, 
  onNext = () => {}, 
  onBack = () => {}, 
  onUpdate = () => {} ,
  step,
  user
}) => {


 // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen w-fit max-w-none">
      <div className="relative z-100 flex flex-col justify-center items-center px-8 py-4 -my-20">
        {/* Header - logo and avatar */}
       <header className="bg-[#002147] w-[95%] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between">
          <div className="text-white text-xl font-semibold">Logo</div>
          
          {/* User Avatar with blue border */}
          <div className="relative">
            {user?.image ? (
              <img
                src={user.image}
                alt={`${user.name || 'User'} avatar`}
                className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback avatar with user initials */}
            <div 
              className={`w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm ${user?.image ? 'hidden' : 'flex'}`}
            >
              {getUserInitials()}
            </div>
          </div>
        </header>
        {/* Decorative background blobs - Same as StudyLevelStep */}
        <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>
        <div className="absolute top-[18%] left-0 w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>

        {/* Welcome text section */}
        <div className="text-center flex flex-col gap-5 items-center justify-center space-y-4 mb-6 mt-6 w-[80%] mx-auto">
          <h1 className="text-[2.2rem] tracking-normal font-normal leading-12 font-roboto text-black z-10">
            <span className="text-[#8a99aa]"> Welcome </span> Martin! We are
            thrilled to have you here. Discover the world's leading universities
            to shape your academic journey.
          </h1>
          <p className="text-xl font font-normal tracking-normal leading-7 text-black z-10">
            Shape your future! Choose your country, subject and Degree Level to
            unlock tailoured study oppurtunities. Takes about 1-2 minutes
          </p>
        </div>

        {/* Step indicator */}
        <div className="text-center mb-8 mt-10">
          <div className="inline-flex items-center bg-blue-100 text-black px-4 py-2 rounded-lg font-semibold text-sm mb-4">
          Step {`0${step}`} 
          </div>
          <p className="text-sm text-black font-medium mb-5 z-10">
            Choose your degree level
          </p>
        </div>

        {/* Study Level Options Grid */}
        <div className="mb-8 flex justify-center z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
            {studyLevels.map((level) => {
              const isSelected = selectedLevel === level.id;

              return (
                <div
                  key={level.id}
                  onClick={() => onUpdate(level.id)}
                  className={`p-8 rounded-2xl border-4 transition-all duration-300 transform cursor-pointer ${
                    isSelected
                      ? "border-[#002147] bg-white shadow-xl scale-105"
                      : "border-gray-300 bg-white hover:border-[#002147] hover:shadow-lg hover:scale-105"
                  }`}
                >
                  <div className="flex items-start space-x-6">
                    {/* Icon */}
                    <div className="text-5xl flex-shrink-0">{level.icon}</div>

                    {/* Text Content */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-black mb-2">
                        {level.title}
                      </h3>
                      <p className="text-lg text-[#8a99aa] mb-3">{level.subtitle}</p>
                      <p className="text-base text-gray-600">{level.description}</p>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 bg-[#002147] rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation buttons */}
       <div className="flex justify-between items-center w-full max-w-6xl px-4 mt-8 z-10 pb-20">
          <Button
            onClick={onBack}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-l ml-36"
          >
            
            Back
         <span className="mr-2">←</span> 

          </Button>
          
          <Button
            onClick={onNext}
            disabled={!selectedLevel}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg mr-36"
          >
            Next <span className="">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Demo Wrapper Component
// - Controls state and shows the step
// -----------------------------------------------------------------------------
export default function StudyLevelDemo() {
  const [selectedLevel, setSelectedLevel] = useState(null);

  return (
    <StudyLevelStep
      selectedLevel={selectedLevel}
      onUpdate={setSelectedLevel}
      onNext={() => console.log("Next clicked with:", selectedLevel)}
      onBack={() => console.log("Back clicked")}
    />
  );
}