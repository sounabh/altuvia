

export const ProgressIndicator = ({ currentStep, totalSteps, stepNames }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {totalSteps}
          </h2>
          <span className="text-sm text-gray-500">
            {stepNames[currentStep]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#002147] h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
