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

  const [currentStep, setCurrentStep] = useState(-1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [studentId, setStudentId] = useState(null);
  const [tokenexpired, setTokenExpired] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userHasProfile, setUserHasProfile] = useState(false);

  // Add new state to track OAuth processing
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Centralized data state
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

  // Handle session-based authentication (OAuth)
  const handleSessionAuth = useCallback(async (sessionData) => {
    console.log("📨 Session detected, sending to backend:", sessionData);

    setIsProcessingOAuth(true); // Set processing state

    try {
     const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      // Prepare session data for backend
      const sessionPayload = {
        email: sessionData.user.email,
        name: sessionData.user.name || sessionData.user.email?.split("@")[0],
        image: sessionData.user.image || null,
        provider: sessionData.provider || "google",
        emailVerified: sessionData.user.emailVerified !== false,
        oauthId: sessionData.user.id || sessionData.user.sub || null,
      };

      console.log("🔄 Sending session data to backend:", sessionPayload);

      const response = await fetch(`${API_BASE_URL}/api/user/oauth-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionPayload),
      });

      const data = await response.json();
      console.log("📥 Backend OAuth response:", data);

      if (response.ok && data.success) {
        // Store auth data in localStorage
        const authData = {
          token: data.token,
          userId: data.data.userId,
          email: data.data.email,
          name: data.data.name,
          provider: data.data.provider,
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem("authData", JSON.stringify(authData));

        // Create session object for internal use
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

        // Check if user has complete profile
        if (data.data.hasCompleteProfile) {
          console.log(
            "✅ OAuth user has complete profile, redirecting to dashboard"
          );
          setStudentId(data.data.userId);
          setUserHasProfile(true);
        } else {
          console.log("🚀 OAuth user needs onboarding");
          setStudentId(null);
          setUserHasProfile(false);
          setCurrentStep(0);
        }

        return true;
      } else {
        console.error("❌ OAuth backend auth failed:", data.error);
        localStorage.removeItem("authData");
        setShowAuthModal(true);
        setCurrentStep(-1);
        setUser(null);
        setStudentId(null);
        setUserHasProfile(false);
        return false;
      }
    } catch (error) {
      console.error("❌ Session auth error:", error);
      localStorage.removeItem("authData");
      setShowAuthModal(true);
      setCurrentStep(-1);
      setUser(null);
      setStudentId(null);
      setUserHasProfile(false);
      return false;
    } finally {
      setIsProcessingOAuth(false); // Clear processing state
      setIsInitializing(false); // Clear initial loading
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    const authData =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    const token = authData ? JSON.parse(authData).token : null;

    if (!token) {
      console.warn("⚠️ No auth token found in localStorage");
      setShowAuthModal(true);
      setCurrentStep(-1);
      setIsInitializing(false);
      return;
    }

    setIsCheckingUser(true);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.warn(
          "⚠️ Token expired or invalid, clearing localStorage and showing auth modal"
        );
        localStorage.removeItem("authData");
        setTokenExpired(true);
        setShowAuthModal(true);
        setCurrentStep(-1);
        setUser(null);
        setStudentId(null);
        setUserHasProfile(false);
        setIsCheckingUser(false);
        setIsInitializing(false);
        return;
      } else if (response.status === 200) {
        setTokenExpired(false);
        console.log("✅ User data fetched successfully");

        const userData = await response.json();
        console.log("====================================");
        console.log("userData:", userData);
        console.log("====================================");

        const hasCompleteProfile =
          userData.data?.profile && userData.data?.subscription;

        if (hasCompleteProfile) {
          console.log(
            "✅ User has complete profile, should redirect to dashboard"
          );
          setStudentId(userData.id);
          setUserHasProfile(true);
        } else {
          console.log("🚀 User exists but needs to complete onboarding");
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
      console.error("⚠️ Error fetching user data:", error);
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
  }, []);

  // Initialize the flow based on authentication status
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      console.log("✅ Session exists:", session.user);
      handleSessionAuth(session);
    } else {
      const authData =
        typeof window !== "undefined" ? localStorage.getItem("authData") : null;

      if (authData) {
        console.log("🔍 Found auth data in localStorage, validating...");
        const load = async () => {
          await fetchUserData();
        };
        load();
      } else {
        console.log("🔐 No session or localStorage found, showing auth modal");
        setShowAuthModal(true);
        setCurrentStep(-1);
        setUser(null);
        setIsInitializing(false);
      }
    }
  }, [session, status, handleSessionAuth, fetchUserData]);

  // Effect to handle navigation after user status is determined
  useEffect(() => {
    if (!isCheckingUser && !isProcessingOAuth && user) {
      if (studentId && userHasProfile) {
        console.log("✅ User has complete profile, redirecting to dashboard");
        setTimeout(() => {
          try {
            router.push("/dashboard");
          } catch (error) {
            window.location.href = "/dashboard";
          }
        }, 500);
      } else if (!studentId && !userHasProfile) {
        console.log(
          "🚀 Starting onboarding for user who needs to complete profile"
        );
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

  // Handle successful authentication from AuthModal (manual auth)
  const handleAuthSuccess = useCallback(
    (sessionData, shouldStartOnboarding = false) => {
      console.log(
        "🔐 Manual authentication successful, shouldStartOnboarding:",
        shouldStartOnboarding
      );
      setShowAuthModal(false);
      setUser(sessionData || null);
      setRenderKey((prev) => prev + 1);

      if (shouldStartOnboarding) {
        console.log("🆕 New user, starting onboarding immediately");
        setStudentId(null);
        setUserHasProfile(false);
        setCurrentStep(0);
        setIsInitializing(false);
      } else {
        const load = async () => {
          await fetchUserData();
        };
        load();
      }
    },
    [fetchUserData]
  );

  // Navigation functions
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

  // Update shared data
  const updateData = useCallback((newData) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Handle onboarding completion with redirect
  const handleOnboardingComplete = useCallback(
    (responseData) => {
      console.log("🎉 Onboarding completed successfully!");
      console.log("📊 Response data:", responseData);

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

      setTimeout(() => {
        try {
          router.push("/dashboard");
        } catch (error) {
          window.location.href = "/dashboard";
        }
      }, 500);
    },
    [router]
  );

  // Combined loading states
  const isLoading =
    status === "loading" ||
    isCheckingUser ||
    isProcessingOAuth ||
    isInitializing;

  // Loading state for any authentication/initialization process
  if (isLoading) {
    let loadingMessage = "Checking authentication...";

    if (status === "loading") {
      loadingMessage = "Initializing session...";
    } else if (isProcessingOAuth) {
      loadingMessage = "Processing login...";
    } else if (isCheckingUser) {
      loadingMessage = "Checking user status...";
    } else if (isInitializing) {
      loadingMessage = "Setting up your experience...";
    }

    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // If user has complete profile, show loading message before redirect
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

        {/* Fallback - only show if something is genuinely wrong */}
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
