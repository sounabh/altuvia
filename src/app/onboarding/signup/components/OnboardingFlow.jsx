"use client";

import { useOnboardingFlow } from "@/lib/hooks/useOnboardingFlow";
import { AuthModal } from "./AuthModal";
import { PremiumLoadingScreen, SuccessLoadingScreen } from "@/components/skeletons/PremiumLoadingScreen";
import { OnboardingStepsRenderer } from "@/components/OnboardingStepsRenderer";
import { OnboardingErrorFallback } from "@/components/OnboardingErrorFallback";

/**
 * Onboarding Flow Component
 * Manages the complete user onboarding process including authentication and step progression
 * Handles user session management, authentication flows, and multi-step onboarding
 */
export const OnboardingFlow = () => {
  const {
    // State
    currentStep,
    showAuthModal,
    user,
    renderKey,
    hasCompleteProfile,
    isLoading,
    loadingMessage,
    data,
    
    // Handlers
    setShowAuthModal,
    handleAuthSuccess,
    handleNext,
    handleBack,
    updateData,
    handleOnboardingComplete,
    handleErrorRetry,
  } = useOnboardingFlow();

  console.log('🔍 OnboardingFlow Debug:', {
    isLoading,
    user: !!user,
    hasCompleteProfile,
    currentStep,
    showAuthModal
  });

  // Show premium loading screen during initial checks
  if (isLoading) {
    return <PremiumLoadingScreen message={loadingMessage} />;
  }

  // Show success loading screen before redirecting to dashboard
  if (user && hasCompleteProfile) {
    return <SuccessLoadingScreen />;
  }

  // Main component render
  return (
    <div className="h-screen" key={renderKey}>
      <div className="pt-20">
        {/* Authentication Modal */}
        {showAuthModal && !user && (
          <AuthModal
            isOpen={showAuthModal}
            user={user}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* Onboarding Steps - Show when user exists but profile incomplete */}
        {user && !hasCompleteProfile && currentStep >= 0 && (
          <OnboardingStepsRenderer
            currentStep={currentStep}
            data={data}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={updateData}
            onComplete={handleOnboardingComplete}
            renderKey={renderKey}
          />
        )}

        {/* Error Fallback */}
        {!isLoading &&
          currentStep < 0 &&
          !showAuthModal &&
          !user && (
            <OnboardingErrorFallback onRetry={handleErrorRetry} />
          )}
      </div>
    </div>
  );
};