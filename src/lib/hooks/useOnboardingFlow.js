import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ONBOARDING_STEPS, LOADING_MESSAGES, API_BASE_URL } from "@/lib/constants/onboarding";

/**
 * Custom hook for onboarding flow logic
 * Handles authentication and onboarding progression using NextAuth session only
 * @returns {Object} Onboarding state and handlers
 */
export const useOnboardingFlow = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // State variables for managing onboarding flow
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES.SETUP);

  // Centralized state for storing onboarding data across steps
  const [data, setData] = useState({
    countries: [],
    courses: [],
    studyLevel: "",
    academicInfo: {},
    paymentInfo: {},
  });

  /**
   * Main initialization effect - handles all authentication states
   */
  useEffect(() => {
    // Wait for session to load
    if (status === "loading") {
      setLoadingMessage(LOADING_MESSAGES.CHECKING_USER);
      return;
    }

    // No session - show auth modal
    if (status === "unauthenticated") {
      setShowAuthModal(true);
      setCurrentStep(-1);
      setIsInitializing(false);
      return;
    }

    // Has session - check profile completion status
    if (status === "authenticated" && session?.user) {
      // User has complete profile - redirect to dashboard
      if (session.hasCompleteProfile) {
        setLoadingMessage(LOADING_MESSAGES.PROCESSING_LOGIN);
        setIsInitializing(false);
        router.push("/dashboard");
        return;
      }

      // User needs to complete profile - start onboarding
      if (!session.hasCompleteProfile) {
        setShowAuthModal(false);
        setCurrentStep(0);
        setIsInitializing(false);
        return;
      }
    }

    // Fallback
    setShowAuthModal(true);
    setCurrentStep(-1);
    setIsInitializing(false);
  }, [session, status, router]);

  /**
   * Manual Authentication Handler
   */
  const handleAuthSuccess = useCallback(
    async (userData, isNewUser = false) => {
      setShowAuthModal(false);
      setRenderKey((prev) => prev + 1);

      // Update session with new data
      await update({
        hasCompleteProfile: userData?.user?.hasCompleteProfile || false,
        isNewUser: isNewUser,
      });

      // New user or incomplete profile - start onboarding
      if (isNewUser || !userData?.user?.hasCompleteProfile) {
        setCurrentStep(0);
      } else {
        // Existing user with complete profile - redirect to dashboard
        router.push("/dashboard");
      }
    },
    [update, router]
  );

  /**
   * Navigates to the next step in the onboarding flow
   */
  const handleNext = useCallback(() => {
    setCurrentStep((prevStep) => {
      const nextStep = prevStep + 1;
      if (nextStep < ONBOARDING_STEPS.length) {
        setRenderKey((prev) => prev + 1);
        return nextStep;
      }
      return prevStep;
    });
  }, []);

  /**
   * Navigates to the previous step in the onboarding flow
   */
  const handleBack = useCallback(() => {
    setCurrentStep((prevStep) => {
      if (prevStep > 0) {
        const backStep = prevStep - 1;
        setRenderKey((prev) => prev + 1);
        return backStep;
      }
      return prevStep;
    });
  }, []);

  /**
   * Updates the centralized onboarding data state
   */
  const updateData = useCallback((newData) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  /**
   * Onboarding Completion Handler
   */
  const handleOnboardingComplete = useCallback(
    async (responseData) => {
      // Update session to mark profile as complete
      await update({
        hasCompleteProfile: true,
        token: responseData?.token,
        userId: responseData?.data?.userId,
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    },
    [update, router]
  );

  /**
   * Error fallback handler
   */
  const handleErrorRetry = useCallback(() => {
    setCurrentStep(-1);
    setShowAuthModal(true);
    setIsInitializing(false);
  }, []);

  // Composite loading state
  const isLoading = status === "loading" || isInitializing;

  return {
    // State
    currentStep,
    showAuthModal,
    user: session?.user || null,
    renderKey,
    hasCompleteProfile: session?.hasCompleteProfile || false,
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
  };
};