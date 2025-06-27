// -----------------------------------------------------------------------------
// ProgressIndicator Component
// Props:
// - currentStep: the current active step (0-indexed)
// - totalSteps: total number of steps in the form
// - stepNames: array of step name strings, for current step label
// -----------------------------------------------------------------------------
export const ProgressIndicator = ({ currentStep, totalSteps, stepNames }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white/70 backdrop-blur-md border border-gray-200 shadow-md rounded-xl px-4 py-2 z-50">
      <div className="flex items-center justify-between mb-1 text-xs text-gray-600">
        <span className="font-semibold">Step {currentStep + 1} of {totalSteps}</span>
        <span className="text-gray-500">{stepNames[currentStep]}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-gray-200 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[#002147] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
