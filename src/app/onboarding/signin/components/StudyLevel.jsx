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
export const StudyLevelStep = ({ selectedLevel, onNext, onBack, onUpdate }) => {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

        {/* -------------------------- */}
        {/* Header Section             */}
        {/* -------------------------- */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#002147]">
            What level of study?
          </h1>
          <p className="text-xl text-gray-600">
            Choose the degree level you're interested in
          </p>
        </div>

        {/* -------------------------- */}
        {/* Study Level Options Grid   */}
        {/* -------------------------- */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {studyLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => onUpdate(level.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 text-left ${
                  selectedLevel === level.id
                    ? "border-indigo-500 bg-indigo-50 shadow-lg scale-105"
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start space-x-4">

                  {/* Icon */}
                  <div className="text-4xl">{level.icon}</div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {level.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{level.subtitle}</p>
                    <p className="text-sm text-gray-500">{level.description}</p>
                  </div>

                  {/* Selected Indicator (dot inside circle) */}
                  {selectedLevel === level.id && (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}

          </div>

          {/* -------------------------- */}
          {/* Navigation Buttons         */}
          {/* -------------------------- */}
          <div className="flex justify-between">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {/* Continue Button (disabled if no selection) */}
            <Button
              onClick={onNext}
              disabled={!selectedLevel}
              className="bg-[#002147] text-white px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
