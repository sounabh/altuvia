// ==========================================
// FILE: components/OnboardingFlow.jsx

// ==========================================
"use client";

import { useOnboardingFlow } from "@/lib/hooks/useOnboardingFlow";
import { toast } from "sonner";
import { AuthModal } from "./AuthModal";
import { PremiumLoadingScreen, SuccessLoadingScreen } from "@/components/skeletons/PremiumLoadingScreen";
import { OnboardingStepsRenderer } from "@/components/OnboardingStepsRenderer";
import { OnboardingErrorFallback } from "@/components/OnboardingErrorFallback";
import { useEffect, useCallback, memo } from "react";


//prevents unneccesary re-renders until inside hooks changes
export const OnboardingFlow = memo(() => {
  const {
    currentStep,
    showAuthModal,
    user,
    renderKey,
    hasCompleteProfile,
    isLoading,
    loadingMessage,
    data,
    setShowAuthModal,
    handleAuthSuccess,
    handleNext,
    handleBack,
    updateData,
    handleOnboardingComplete,
    handleErrorRetry,
  } = useOnboardingFlow();

  /**
   * Memoized handlers with toast notifications
   */
  const handleNextWithToast = useCallback((stepData) => {
    toast.success("Step completed!", { duration: 1000 });
    handleNext(stepData);
  }, [handleNext]);

  const handleBackWithToast = useCallback(() => {
    handleBack();
  }, [handleBack]);

  const handleOnboardingCompleteWithToast = useCallback((finalData) => {
    toast.success("Onboarding completed!", { duration: 1500 });
    handleOnboardingComplete(finalData);
  }, [handleOnboardingComplete]);

  const handleErrorRetryWithToast = useCallback(() => {
    toast("Retrying...", { duration: 1000 });
    handleErrorRetry();
  }, [handleErrorRetry]);



  /**
   * Welcome toast only once on first step
   */
  useEffect(() => {
    if (user && !hasCompleteProfile && currentStep === 0) {
      const toastId = toast("Welcome! Let's set up your profile", { duration: 2000 });
      return () => toast.dismiss(toastId);
    }
  }, [user, hasCompleteProfile, currentStep]);

  // CRITICAL: Define rendering conditions clearly
  const shouldShowSteps = user && !hasCompleteProfile && currentStep >= 0 && !isLoading;//When user logged in but still onboarding
  const shouldShowAuthModal = showAuthModal && !user; //When not logged in show AuthModal
  const shouldShowError = !isLoading && currentStep < 0 && !showAuthModal && !user; //When something failed during init
  const shouldShowLoading = isLoading; //When data/auth still loading
  const shouldShowSuccess = user && hasCompleteProfile; //When onboarding is done successfully

  /*
  console.log("🎨 Render state:", {
    user: !!user,
    hasCompleteProfile,
    currentStep,
    isLoading,
    shouldShowSteps,
    shouldShowAuthModal,
    shouldShowLoading,
    shouldShowSuccess
  });*/

  // Show loading screen only when actually loading
  if (shouldShowLoading) {
    return <PremiumLoadingScreen message={loadingMessage} />;
  }

  // Show success screen for complete profile
  if (shouldShowSuccess) {
    return <SuccessLoadingScreen />;
  }

  return (
    <div className="h-screen" key={renderKey}>
      <div className="pt-20">
        {/* Authentication Modal */}
        {shouldShowAuthModal && (
          <AuthModal
            isOpen={true}
            user={user}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* Onboarding Steps - Render immediately when conditions met */}
        {shouldShowSteps && (
          <OnboardingStepsRenderer
            currentStep={currentStep}
            data={data}
            user={user}
            onNext={handleNextWithToast}
            onBack={handleBackWithToast}
            onUpdate={updateData}
            onComplete={handleOnboardingCompleteWithToast}
            renderKey={renderKey}
          />
        )}

        {/* Error Fallback */}
        {shouldShowError && (
          <OnboardingErrorFallback onRetry={handleErrorRetryWithToast} />
        )}
      </div>
    </div>
  );
});

OnboardingFlow.displayName = "OnboardingFlow";