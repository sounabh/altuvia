/**
 * Error Fallback Component
 * Displays when there's an error in the onboarding flow
 * @param {Object} props - Component properties
 * @param {Function} props.onRetry - Retry handler
 * @returns {JSX.Element} Error fallback UI
 */
export const OnboardingErrorFallback = ({ onRetry }) => {
  return (
    <div className="text-center p-8">
      <div className="text-red-600 font-bold mb-4">
        Something went wrong
      </div>
      <p className="mb-4 text-gray-600">
        We&apos;re having trouble loading your account. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
};