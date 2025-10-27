import { CountrySelectionStep } from "@/app/onboarding/signup/components/CountrySelection";
import { CourseSelectionStep } from "@/app/onboarding/signup/components/CourseSelection";
import { StudyLevelStep } from "@/app/onboarding/signup/components/StudyLevel";
import { AcademicSnapshotStep } from "@/app/onboarding/signup/components/AcademicSnapshot";
import { PaymentStep } from "@/app/onboarding/signup/components/PaymentSteps";
import { LoadingStep } from "@/app/onboarding/signup/components/Loading";

/**
 * Onboarding Steps Renderer Component
 * Renders the appropriate step component based on current step
 * @param {Object} props - Component properties
 * @param {number} props.currentStep - Current step index
 * @param {Object} props.data - Onboarding data
 * @param {Object} props.user - User data
 * @param {Function} props.onNext - Next step handler
 * @param {Function} props.onBack - Previous step handler
 * @param {Function} props.onUpdate - Data update handler
 * @param {Function} props.onComplete - Onboarding completion handler
 * @param {number} props.renderKey - Render key for forcing re-renders
 * @returns {JSX.Element} Current step component
 */
export const OnboardingStepsRenderer = ({
  currentStep,
  data,
  user,
  onNext,
  onBack,
  onUpdate,
  onComplete,
  renderKey,
}) => {
  return (
    <div key={renderKey}>
      {currentStep === 0 && (
        <CountrySelectionStep
          selectedCountries={data.countries}
          user={user}
          onNext={onNext}
          onBack={onBack}
          onUpdate={(countries) => onUpdate({ countries })}
          step={1}
        />
      )}

      {currentStep === 1 && (
        <CourseSelectionStep
          selectedCourses={data.courses}
          user={user}
          onNext={onNext}
          onBack={onBack}
          onUpdate={(courses) => onUpdate({ courses })}
          step={2}
        />
      )}

      {currentStep === 2 && (
        <StudyLevelStep
          selectedLevel={data.studyLevel}
          user={user}
          onNext={onNext}
          onBack={onBack}
          onUpdate={(studyLevel) => onUpdate({ studyLevel })}
          step={3}
        />
      )}

      {currentStep === 3 && (
        <AcademicSnapshotStep
          academicInfo={data.academicInfo}
          user={user}
          onNext={onNext}
          onBack={onBack}
          onUpdate={(academicInfo) => onUpdate({ academicInfo })}
          step={4}
        />
      )}

      {currentStep === 4 && (
        <PaymentStep
          paymentInfo={data.paymentInfo}
          user={user}
          onNext={onNext}
          onBack={onBack}
          onUpdate={(paymentInfo) => onUpdate({ paymentInfo })}
          step={5}
        />
      )}

      {currentStep === 5 && (
        <LoadingStep
          userData={data}
          user={user}
          onComplete={onComplete}
        />
      )}
    </div>
  );
};