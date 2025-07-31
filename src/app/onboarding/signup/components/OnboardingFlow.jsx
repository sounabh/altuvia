"use client"; // Indicates this is a Client Component in Next.js

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
  // NextAuth session hook to get authentication status
  const { data: session, status } = useSession();
  const router = useRouter(); // Router for navigation

  // State variables for managing onboarding flow
  const [currentStep, setCurrentStep] = useState(-1); // Current step in onboarding (-1 = not started)
  const [showAuthModal, setShowAuthModal] = useState(false); // Controls visibility of authentication modal
  const [user, setUser] = useState(null); // Stores authenticated user data
  const [renderKey, setRenderKey] = useState(0); // Key to force re-renders when needed
  const [studentId, setStudentId] = useState(null); // ID of authenticated student
  const [tokenexpired, setTokenExpired] = useState(false); // Flag for expired tokens
  const [isCheckingUser, setIsCheckingUser] = useState(false); // Loading state for user checks
  const [userHasProfile, setUserHasProfile] = useState(false); // Tracks if user has complete profile

  // OAuth processing states
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Initial loading state

  // Centralized state for storing onboarding data across steps
  const [data, setData] = useState({
    countries: [],    // Selected countries
    courses: [],      // Selected courses
    studyLevel: "",   // Chosen study level
    academicInfo: {}, // Academic details
    paymentInfo: {},  // Payment information
  });

  // Ordered list of onboarding steps
  const steps = [
    "Countries",
    "Courses",
    "Study Level",
    "Academic Info",
    "Payment",
    "Loading",
  ];

  /**
   * Handles OAuth session authentication
   * - Sends session data to backend
   * - Stores authentication token
   * - Checks if user needs onboarding
   */
  const handleSessionAuth = useCallback(async (sessionData) => {
    setIsProcessingOAuth(true); // Set processing flag

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      // Prepare payload for backend authentication
      const sessionPayload = {
        email: sessionData.user.email,
        name: sessionData.user.name || sessionData.user.email?.split("@")[0],
        image: sessionData.user.image || null,
        provider: sessionData.provider || "google",
        emailVerified: sessionData.user.emailVerified !== false,
   
      };

      // Send authentication request to backend
      const response = await fetch(`${API_BASE_URL}/api/user/oauth-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionPayload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store authentication data in localStorage
        const authData = {
          token: data.token,
          userId: data.data.userId,
          email: data.data.email,
          name: data.data.name,
          provider: data.data.provider,
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

        // Determine if user needs onboarding
        if (data.data.hasCompleteProfile) {
          setStudentId(data.data.userId);
          setUserHasProfile(true);
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
      // Reset processing flags
      setIsProcessingOAuth(false);
      setIsInitializing(false);
    }
  }, []);

  
  /**
   * Fetches user data using stored authentication token
   * - Validates token with backend
   * - Checks profile completion status
   */
  const fetchUserData = useCallback(async () => {
    // Retrieve authentication data from localStorage
    const authData =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    const token = authData ? JSON.parse(authData).token : null;

    if (!token) {
      setShowAuthModal(true);
      setCurrentStep(-1);
      setIsInitializing(false);
      return;
    }

    setIsCheckingUser(true); // Set loading state

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      
      // Request user data from backend
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle token expiration
      if (response.status === 401) {
        localStorage.removeItem("authData");
        setTokenExpired(true);
        setShowAuthModal(true);
        setCurrentStep(-1);
        setUser(null);
        setStudentId(null);
        setUserHasProfile(false);
      } 
      // Handle successful response
      else if (response.status === 200) {
        setTokenExpired(false);
        const userData = await response.json();

        // Check if user has complete profile
        const hasCompleteProfile =
          userData.data?.profile && userData.data?.subscription;

        if (hasCompleteProfile) {
          setStudentId(userData.id);
          setUserHasProfile(true);
        } else {
          setStudentId(null);
          setUserHasProfile(false);
          setUser({
            user: {
              id: userData.id,
              name: userData.data?.name,
              email: userData.data?.email,
              image: userData.data?.image,
              provider: userData.data?.provider,
            },
          });
        }
      }
    } catch (error) {
      // Handle fetch errors
      localStorage.removeItem("authData");
      setShowAuthModal(true);
      setCurrentStep(-1);
      setUser(null);
      setStudentId(null);
      setUserHasProfile(false);
    } finally {
      // Reset loading states
      setIsCheckingUser(false);
      setIsInitializing(false);
    }
  }, []);

  /**
   * Initialization Effect
   * 
   * Determines initial authentication state:
   * 1. Checks NextAuth session
   * 2. Falls back to localStorage token
   * 3. Shows auth modal if no credentials
   */
  useEffect(() => {
    if (status === "loading") return; // Wait for session loading

    // Handle authenticated session
    if (session?.user) {
      handleSessionAuth(session);
    } 
    // Check localStorage for existing auth
    else {
      const authData =
        typeof window !== "undefined" ? localStorage.getItem("authData") : null;

      if (authData) {
        fetchUserData();
      } 
      // No credentials found
      else {
        setShowAuthModal(true);
        setCurrentStep(-1);
        setUser(null);
        setIsInitializing(false);
      }
    }
  }, [session, status, handleSessionAuth, fetchUserData]);

  /**
   * Navigation Effect
   * 
   * Determines where to send user after authentication:
   * - Dashboard if profile complete
   * - Onboarding if profile incomplete
   */
  useEffect(() => {
    // Only run when all checks are complete
    if (!isCheckingUser && !isProcessingOAuth && user) {
      // Redirect to dashboard if profile complete
      if (studentId && userHasProfile) {
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } 
      // Start onboarding if profile incomplete
      else if (!studentId && !userHasProfile) {
        setCurrentStep(0);
      }
    }
  }, [
    user,
    studentId,
    userHasProfile,
    isCheckingUser,
    isProcessingOAuth,
    router,
  ]);

  /**
   * Manual Authentication Handler
   * 
   * @param {Object} sessionData - User session data
   * @param {boolean} shouldStartOnboarding - Whether to start onboarding immediately
   */
  const handleAuthSuccess = useCallback(
    (sessionData, shouldStartOnboarding = false) => {
      setShowAuthModal(false);
      setUser(sessionData || null);
      setRenderKey((prev) => prev + 1); // Force re-render

      // Start onboarding for new users
      if (shouldStartOnboarding) {
        setStudentId(null);
        setUserHasProfile(false);
        setCurrentStep(0);
        setIsInitializing(false);
      } 
      // Check existing users
      else {
        fetchUserData();
      }
    },
    [fetchUserData]
  );

  // Step navigation functions
  const handleNext = useCallback(() => {
    setCurrentStep((prevStep) => {
      const nextStep = prevStep + 1;
      if (nextStep < steps.length) {
        setRenderKey((prev) => prev + 1); // Force re-render
        return nextStep;
      }
      return prevStep;
    });
  }, [steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep((prevStep) => {
      if (prevStep > 0) {
        const backStep = prevStep - 1;
        setRenderKey((prev) => prev + 1); // Force re-render
        return backStep;
      }
      return prevStep;
    });
  }, []);

  /**
   * Data Update Handler
   * 
   * Merges new data into central onboarding state
   * @param {Object} newData - Partial data to merge
   */
  const updateData = useCallback((newData) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  /**
   * Onboarding Completion Handler
   * 
   * - Stores final auth token
   * - Redirects to dashboard
   * @param {Object} responseData - Final response from backend
   */
  const handleOnboardingComplete = useCallback(
    (responseData) => {
      // Store authentication token if provided
      if (responseData && responseData.token) {
        const authData = {
          token: responseData.token,
          userId: responseData.data?.userId,
          email: responseData.data?.email,
          name: responseData.data?.name,
          provider: responseData.data?.provider,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(authData));
      }

      // Redirect to dashboard
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
            {/* Step 1: Country Selection */}
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

            {/* Step 2: Course Selection */}
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

            {/* Step 3: Study Level */}
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

            {/* Step 4: Academic Info */}
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

            {/* Step 5: Payment */}
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

            {/* Step 6: Loading/Submission */}
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