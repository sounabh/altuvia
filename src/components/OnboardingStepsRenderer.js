// ==========================================
// FILE: components/OnboardingStepsRenderer.jsx
// COMPLETE - NO MISSING CODE
// ==========================================
import { lazy, Suspense, memo } from "react";

/**
 * Lazy load step components
 */
const CountrySelectionStep = lazy(() => 
  import("@/app/onboarding/signup/components/CountrySelection").then(m => ({ default: m.CountrySelectionStep }))
);
const CourseSelectionStep = lazy(() => 
  import("@/app/onboarding/signup/components/CourseSelection").then(m => ({ default: m.CourseSelectionStep }))
);
const StudyLevelStep = lazy(() => 
  import("@/app/onboarding/signup/components/StudyLevel").then(m => ({ default: m.StudyLevelStep }))
);
const AcademicSnapshotStep = lazy(() => 
  import("@/app/onboarding/signup/components/AcademicSnapshot").then(m => ({ default: m.AcademicSnapshotStep }))
);
const PaymentStep = lazy(() => 
  import("@/app/onboarding/signup/components/PaymentSteps").then(m => ({ default: m.PaymentStep }))
);
const LoadingStep = lazy(() => 
  import("@/app/onboarding/signup/components/Loading").then(m => ({ default: m.LoadingStep }))
);

/**
 * Loading fallback
 */
const StepLoadingFallback = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-[#002147] border-t-transparent rounded-full animate-spin"></div>
  </div>
));

StepLoadingFallback.displayName = "StepLoadingFallback";

/**
 * FIXED: Onboarding Steps Renderer Component
 */
export const OnboardingStepsRenderer = memo(({
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
      <Suspense fallback={<StepLoadingFallback />}>
        {currentStep === 0 && (
          <CountrySelectionStep
            selectedCountries={data?.countries}
            user={user}
            onNext={onNext}
            onBack={onBack}
            onUpdate={(countries) => onUpdate({ countries })}
            step={1}
          />
        )}

        {currentStep === 1 && (
          <CourseSelectionStep
            selectedCourses={data?.courses}
            user={user}
            onNext={onNext}
            onBack={onBack}
            onUpdate={(courses) => onUpdate({ courses })}
            step={2}
          />
        )}

        {currentStep === 2 && (
          <StudyLevelStep
            selectedLevel={data?.studyLevel}
            user={user}
            onNext={onNext}
            onBack={onBack}
            onUpdate={(studyLevel) => onUpdate({ studyLevel })}
            step={3}
          />
        )}

        {currentStep === 3 && (
          <AcademicSnapshotStep
            academicInfo={data?.academicInfo}
            user={user}
            onNext={onNext}
            onBack={onBack}
            onUpdate={(academicInfo) => onUpdate({ academicInfo })}
            step={4}
          />
        )}
 {/** {currentStep === 4 && (
          <PaymentStep
            paymentInfo={data?.paymentInfo}
            user={user}
            onNext={onNext}
            onBack={onBack}
            onUpdate={(paymentInfo) => onUpdate({ paymentInfo })}
            step={5}
          />
        )} */}
       

        {currentStep === 4 && (
          <LoadingStep
            userData={data}
            user={user}
            onComplete={onComplete}
          />
        )}
      </Suspense>
    </div>
  );
});

OnboardingStepsRenderer.displayName = "OnboardingStepsRenderer";