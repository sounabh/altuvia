/*custom React hook that manages user authentication + onboarding state that uses NextAuth for authentication.* */


import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export const useOnboardingFlow = () => {
  const router = useRouter();
  const { data: session, status } = useSession(); //next auth sessio 
  
  const [currentStep, setCurrentStep] = useState(-1); //Tracks which onboarding step user is on (-1 = auth modal)
  const [showAuthModal, setShowAuthModal] = useState(false); //Whether login/signup modal is visible
  const [user, setUser] = useState(null); //Stores logged-in user info
  const [renderKey, setRenderKey] = useState(0); //force render
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false); //Whether user's onboarding is done
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [data, setData] = useState({}); //Stores collected onboarding form data

  
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        // Wait for session to load
        if (status === "loading") {
          setIsLoading(true);
          setLoadingMessage("Checking authentication...");
          return;
        }

        setIsLoading(true);
        setLoadingMessage("Loading your profile...");

        //checking user
        const authUser = session?.user;
        
        if (authUser) {
          // ✅ User is authenticated
          setUser(authUser);
          
          //checking users profile if auth and if profile
          const profileComplete = session?.hasCompleteProfile === true;
          
          /*
          console.log("📊 Authenticated user:", {
            email: authUser.email,
            hasCompleteProfile: profileComplete,
          });*/
          
          setHasCompleteProfile(profileComplete);
          
          if (profileComplete) {
            // Profile complete → redirect to dashboard
            setLoadingMessage("Profile complete! Redirecting...");
            setTimeout(() => router.push("/dashboard"), 1500);
          } else {
            // ============================================================
            // BETA BYPASS — profile incomplete but we skip onboarding.
            // Redirect straight to dashboard for all users in beta.
            // ============================================================
            setLoadingMessage("Redirecting to dashboard...");
            setTimeout(() => router.push("/dashboard"), 1500);

            // ============================================================
            // FUTURE USE — uncomment the block below (and remove the two
            // lines above) when onboarding should run again for users
            // whose profile is not yet complete.
            // ============================================================
            // setShowAuthModal(false); // Don't show auth modal
            // setCurrentStep(0); // Start onboarding
            // setIsLoading(false);
          }
        } else {
          // ❌ Not authenticated → Show auth modal
          setShowAuthModal(true);
          setCurrentStep(-1);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setShowAuthModal(true);
        setCurrentStep(-1);
        setIsLoading(false);
      }
    };

    initializeOnboarding();
  }, [session, status, router]);


  //on auth complete
  const handleAuthSuccess = useCallback((authenticatedUser) => {
   // console.log("🔐 Auth success, starting onboarding");
    setUser(authenticatedUser);
    setShowAuthModal(false);

    // ============================================================
    // BETA BYPASS — after successful auth redirect to dashboard
    // instead of starting onboarding.
    // ============================================================
    setLoadingMessage("Redirecting to dashboard...");
    setIsLoading(true);
    setTimeout(() => router.push("/dashboard"), 1500);

    // ============================================================
    // FUTURE USE — uncomment the two lines below (and remove the
    // three lines above) when onboarding should start after login.
    // ============================================================
    // setCurrentStep(0);
    // setRenderKey(prev => prev + 1);
  }, [router]);


  //next
  const handleNext = useCallback((stepData) => {
    if (stepData) {
      setData(prev => ({ ...prev, ...stepData }));
    }
    setCurrentStep(prev => prev + 1);
    setRenderKey(prev => prev + 1);
  }, []);

  //prev
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setRenderKey(prev => prev + 1);
    }
  }, [currentStep]);


  //update data
  const updateData = useCallback((updates) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);


  //on profile complete 
  const handleOnboardingComplete = useCallback(async (finalData) => {
    try {
      setIsLoading(true);
      setLoadingMessage("Saving your profile...");
      setHasCompleteProfile(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setIsLoading(false);
    }
  }, [data]);


  //on error
  const handleErrorRetry = useCallback(() => {
    setShowAuthModal(true);
    setCurrentStep(-1);
    setRenderKey(prev => prev + 1);
  }, []);

  return {
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
  };
};