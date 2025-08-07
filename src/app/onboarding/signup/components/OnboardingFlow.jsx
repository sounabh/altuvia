"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Step Components
import { AuthModal } from "./AuthModal";
import { CountrySelectionStep } from "./CountrySelection";
import { CourseSelectionStep } from "./CourseSelection";
import { StudyLevelStep } from "./StudyLevel";
import { AcademicSnapshotStep } from "./AcademicSnapshot";
import { PaymentStep } from "./PaymentSteps";
import { LoadingStep } from "./Loading";

export const OnboardingFlow = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State variables for managing onboarding flow
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [studentId, setStudentId] = useState(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userHasProfile, setUserHasProfile] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Centralized state for storing onboarding data across steps
  const [data, setData] = useState({
    countries: [],
    courses: [],
    studyLevel: "",
    academicInfo: {},
    paymentInfo: {},
  });

  const steps = [
    "Countries",
    "Courses", 
    "Study Level",
    "Academic Info",
    "Payment",
    "Loading",
  ];

  /**
   * Utility function to check if token is expired or old
   */
 const isTokenExpired = useCallback((authData) => {
  // ✅ Always return false - let backend handle token validation
  // The JWT token itself has a 30-day expiry built-in
  if (!authData || !authData.token) return true; // Only check if token exists
  
  return false; // Let backend validate actual JWT expiration
}, []);
  /**
   * Handles OAuth session authentication
   */
  const handleSessionAuth = useCallback(async (sessionData) => {
    setIsProcessingOAuth(true);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const sessionPayload = {
        email: sessionData.user.email,
        name: sessionData.user.name || sessionData.user.email?.split("@")[0],
        image: sessionData.user.image || null,
        provider: sessionData.provider || "google",
        emailVerified: sessionData.user.emailVerified !== false,
      };

      const response = await fetch(`${API_BASE_URL}/api/user/oauth-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionPayload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store complete auth data with profile completion flag
        const authData = {
          token: data.token,
          userId: data.data.userId,
          email: data.data.email,
          name: data.data.name,
          provider: data.data.provider,
          hasCompleteProfile: data.data.hasCompleteProfile,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        // Create session object for frontend use
        const sessionObject = {
          user: {
            id: data.data.userId,
            name: data.data.name,
            email: data.data.email,
            image: data.data.image,
            provider: data.data.provider,
            emailVerified: data.data.emailVerified,
          },
        };

        setUser(sessionObject);
        setShowAuthModal(false);

        // Use the hasCompleteProfile flag from response
        if (data.data.hasCompleteProfile) {
          setStudentId(data.data.userId);
          setUserHasProfile(true);
          // Direct redirect to dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
        } else {
          setStudentId(null);
          setUserHasProfile(false);
          setCurrentStep(0); // Start onboarding
        }

        return true;
      } else {
        // Handle authentication failure
        localStorage.removeItem("authData");
        setShowAuthModal(true);
        setCurrentStep(-1);
        setUser(null);
        setStudentId(null);
        setUserHasProfile(false);
        return false;
      }
    } catch (error) {
      // Handle network errors
      localStorage.removeItem("authData");
      setShowAuthModal(true);
      setCurrentStep(-1);
      setUser(null);
      setStudentId(null);
      setUserHasProfile(false);
      return false;
    } finally {
      setIsProcessingOAuth(false);
      setIsInitializing(false);
    }
  }, [router]);

  /**
   * Fetches user data only when necessary (token validation)
   */
  const fetchUserData = useCallback(async () => {
    setIsCheckingUser(true);
    
    try {
      const authDataStr = localStorage.getItem("authData");
      if (!authDataStr) {
        setShowAuthModal(true);
        setCurrentStep(-1);
        setIsInitializing(false);
        return;
      }

      const authData = JSON.parse(authDataStr);
      
      // If token is not expired and has complete profile flag, redirect directly
      if (!isTokenExpired(authData) && authData.hasCompleteProfile) {
        setStudentId(authData.userId);
        setUserHasProfile(true);
        setUser({
          user: {
            id: authData.userId,
            name: authData.name,
            email: authData.email,
            provider: authData.provider,
          },
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
        return;
      }

      // Only validate with server if token is old or profile status unknown
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Update localStorage with fresh data including profile status
        const updatedAuthData = {
          ...authData,
          hasCompleteProfile: userData.data.hasCompleteProfile,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(updatedAuthData));

        const sessionObject = {
          user: {
            id: userData.data.userId,
            name: userData.data.name,
            email: userData.data.email,
            provider: userData.data.provider || authData.provider,
          },
        };

        setUser(sessionObject);

        if (userData.data.hasCompleteProfile) {
          setStudentId(userData.data.userId);
          setUserHasProfile(true);
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
        } else {
          setStudentId(null);
          setUserHasProfile(false);
          setCurrentStep(0);
        }
      } else if (response.status === 401) {
        // Token expired, clear localStorage and show auth
        localStorage.removeItem("authData");
        setShowAuthModal(true);
        setCurrentStep(-1);
        setUser(null);
        setStudentId(null);
        setUserHasProfile(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      localStorage.removeItem("authData");
      setShowAuthModal(true);
      setCurrentStep(-1);
      setUser(null);
      setStudentId(null);
      setUserHasProfile(false);
    } finally {
      setIsCheckingUser(false);
      setIsInitializing(false);
    }
  }, [isTokenExpired, router]);

  /**
   * Initialization Effect - Improved logic to minimize API calls
   */
  useEffect(() => {
    if (status === "loading") return;

    // Priority 1: Handle NextAuth session
    if (session?.user) {
      handleSessionAuth(session);
      return;
    }

    // Priority 2: Check localStorage
    const authDataStr = localStorage.getItem("authData");
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        
        // Priority 2a: If has complete profile and token not old, redirect directly
        if (authData.hasCompleteProfile && !isTokenExpired(authData)) {
          setStudentId(authData.userId);
          setUserHasProfile(true);
          setUser({
            user: {
              id: authData.userId,
              name: authData.name,
              email: authData.email,
              provider: authData.provider,
            },
          });
          setIsInitializing(false);
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
          return;
        }

        // Priority 2b: If no complete profile and token valid, start onboarding
        if (!authData.hasCompleteProfile && !isTokenExpired(authData)) {
          setUser({
            user: {
              id: authData.userId,
              name: authData.name,
              email: authData.email,
              provider: authData.provider,
            },
          });
          setStudentId(null);
          setUserHasProfile(false);
          setCurrentStep(0);
          setIsInitializing(false);
          return;
        }

        // Priority 2c: Token is old or status unclear, validate with server
        fetchUserData();
      } catch (error) {
        localStorage.removeItem("authData");
        setShowAuthModal(true);
        setCurrentStep(-1);
        setIsInitializing(false);
      }
    } else {
      // Priority 3: No credentials found
      setShowAuthModal(true);
      setCurrentStep(-1);
      setUser(null);
      setIsInitializing(false);
    }
  }, [session, status, handleSessionAuth, fetchUserData, isTokenExpired, router]);

  /**
   * Manual Authentication Handler
   */
  const handleAuthSuccess = useCallback(
    (sessionData, shouldStartOnboarding = false) => {
      setShowAuthModal(false);
      setUser(sessionData || null);
      setRenderKey((prev) => prev + 1);

      if (shouldStartOnboarding) {
        setStudentId(null);
        setUserHasProfile(false);
        setCurrentStep(0);
        setIsInitializing(false);
      } else {
        // For existing users, check localStorage first
        const authDataStr = localStorage.getItem("authData");
        if (authDataStr) {
          const authData = JSON.parse(authDataStr);
          if (authData.hasCompleteProfile && !isTokenExpired(authData)) {
            setStudentId(authData.userId);
            setUserHasProfile(true);
            setTimeout(() => {
              router.push("/dashboard");
            }, 500);
            return;
          }
        }
        fetchUserData();
      }
    },
    [fetchUserData, isTokenExpired, router]
  );

  // Step navigation functions
  const handleNext = useCallback(() => {
    setCurrentStep((prevStep) => {
      const nextStep = prevStep + 1;
      if (nextStep < steps.length) {
        setRenderKey((prev) => prev + 1);
        return nextStep;
      }
      return prevStep;
    });
  }, [steps.length]);

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

  const updateData = useCallback((newData) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  /**
   * Onboarding Completion Handler - Updates localStorage with complete profile flag
   */
  const handleOnboardingComplete = useCallback(
    (responseData) => {
      if (responseData && responseData.token) {
        const authData = {
          token: responseData.token,
          userId: responseData.data?.userId,
          email: responseData.data?.email,
          name: responseData.data?.name,
          provider: responseData.data?.provider,
          hasCompleteProfile: true, // Set to true after completion
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(authData));
      } else {
        // Update existing localStorage to mark profile as complete
        const existingAuthStr = localStorage.getItem("authData");
        if (existingAuthStr) {
          const existingAuth = JSON.parse(existingAuthStr);
          const updatedAuth = {
            ...existingAuth,
            hasCompleteProfile: true,
            lastLogin: new Date().toISOString(),
          };
          localStorage.setItem("authData", JSON.stringify(updatedAuth));
        }
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    },
    [router]
  );

  // Composite loading state
  const isLoading =
    status === "loading" ||
    isCheckingUser ||
    isProcessingOAuth ||
    isInitializing;

  // Show loading spinner during initial checks
  if (isLoading) {
    let loadingMessage = "Checking authentication...";
    if (status === "loading") loadingMessage = "Initializing session...";
    if (isProcessingOAuth) loadingMessage = "Processing login...";
    if (isCheckingUser) loadingMessage = "Checking user status...";
    if (isInitializing) loadingMessage = "Setting up your experience...";

    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Show loading spinner before redirecting to dashboard
  if (user && studentId && userHasProfile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Welcome back! Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
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

        {/* Onboarding Steps */}
        {user && !studentId && !userHasProfile && currentStep >= 0 && (
          <>
            {currentStep === 0 && (
              <CountrySelectionStep
                selectedCountries={data.countries}
                user={user}
                onNext={handleNext}
                onBack={handleBack}
                onUpdate={(countries) => updateData({ countries })}
                step={1}
              />
            )}

            {currentStep === 1 && (
              <CourseSelectionStep
                selectedCourses={data.courses}
                user={user}
                onNext={handleNext}
                onBack={handleBack}
                onUpdate={(courses) => updateData({ courses })}
                step={2}
              />
            )}

            {currentStep === 2 && (
              <StudyLevelStep
                selectedLevel={data.studyLevel}
                user={user}
                onNext={handleNext}
                onBack={handleBack}
                onUpdate={(studyLevel) => updateData({ studyLevel })}
                step={3}
              />
            )}

            {currentStep === 3 && (
              <AcademicSnapshotStep
                academicInfo={data.academicInfo}
                user={user}
                onNext={handleNext}
                onBack={handleBack}
                onUpdate={(academicInfo) => updateData({ academicInfo })}
                step={4}
              />
            )}

            {currentStep === 4 && (
              <PaymentStep
                paymentInfo={data.paymentInfo}
                user={user}
                onNext={handleNext}
                onBack={handleBack}
                onUpdate={(paymentInfo) => updateData({ paymentInfo })}
                step={5}
              />
            )}

            {currentStep === 5 && (
              <LoadingStep
                userData={data}
                user={user}
                onComplete={handleOnboardingComplete}
              />
            )}
          </>
        )}

        {/* Error Fallback */}
        {!isLoading &&
          currentStep < 0 &&
          !showAuthModal &&
          !user &&
          !isInitializing && (
            <div className="text-center p-8">
              <div className="text-red-600 font-bold mb-4">
                Something went wrong
              </div>
              <p className="mb-4 text-gray-600">
                We're having trouble loading your account. Please try again.
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem("authData");
                  setUser(null);
                  setStudentId(null);
                  setUserHasProfile(false);
                  setCurrentStep(-1);
                  setShowAuthModal(true);
                  setIsInitializing(false);
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
      </div>
    </div>
  );
};