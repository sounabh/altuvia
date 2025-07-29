"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Add this import

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
  const router = useRouter(); // Add router for navigation
  
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [renderKey, setRenderKey] = useState(0);

  // Centralized data state
  const [data, setData] = useState({
    countries: [],
    courses: [],
    studyLevel: "",
    academicInfo: {},
    paymentInfo: {}  
  });

  const steps = [
    "Countries", 
    "Courses",
    "Study Level",
    "Academic Info",
    "Payment",
    "Loading"
  ];

  // Initialize the flow based on authentication status
  useEffect(() => {
    if (status === "loading") return;

    if (session && session.user) {
      console.log('✅ User already authenticated, starting onboarding');
      setUser(session);
      setShowAuthModal(false);
      setCurrentStep(0);
    } else {
      console.log('🔐 No session found, showing auth modal');
      setShowAuthModal(true);
      setCurrentStep(-1);
      setUser(null);
    }
  }, [session, status]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback((sessionData) => {
    console.log('🔐 Authentication successful');
    setShowAuthModal(false);
    setUser(sessionData || null);
    setCurrentStep(0);
    setRenderKey(prev => prev + 1);
  }, []);

  // Navigation functions
  const handleNext = useCallback(() => {
    setCurrentStep(prevStep => {
      const nextStep = prevStep + 1;
      if (nextStep < steps.length) {
        setRenderKey(prev => prev + 1);
        return nextStep;
      }
      return prevStep;
    });
  }, [steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep(prevStep => {
      if (prevStep > 0) {
        const backStep = prevStep - 1;
        setRenderKey(prev => prev + 1);
        return backStep;
      }
      return prevStep;
    });
  }, []);

  // Update shared data
  const updateData = useCallback((newData) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  // Handle onboarding completion with redirect
  const handleOnboardingComplete = useCallback((responseData) => {
    console.log('🎉 Onboarding completed successfully!');
    console.log('📊 Response data:', responseData);
    
    // Save token to localStorage (won't work in Claude artifacts)
    if (responseData?.token) {
      try {
        localStorage.setItem('authToken', responseData.token);
        console.log('✅ Token saved successfully');
      } catch (error) {
        console.warn('⚠️ LocalStorage not available:', error);
      }
    }
    
    // Redirect to dashboard
    setTimeout(() => {
      try {
        router.push('/dashboard');
      } catch (error) {
        // Fallback if router is not available
        window.location.href = '/dashboard';
      }
    }, 500);
  }, [router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen" key={renderKey}>
      <div className="pt-20">
        {/* Authentication Modal */}
        {showAuthModal && !session && (
          <AuthModal 
            isOpen={showAuthModal}
            user={user}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* Step 0: Country Selection */}
        {currentStep === 0 && user && (
          <CountrySelectionStep 
            selectedCountries={data.countries}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(countries) => updateData({ countries })}
            step={1}
          />
        )}

        {/* Step 1: Course Selection */}
        {currentStep === 1 && user && (
          <CourseSelectionStep 
            selectedCourses={data.courses}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(courses) => updateData({ courses })}
            step={2}
          />
        )}

        {/* Step 2: Study Level */}
        {currentStep === 2 && user && (
          <StudyLevelStep 
            selectedLevel={data.studyLevel}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(studyLevel) => updateData({ studyLevel })}
            step={3}
          />
        )}

        {/* Step 3: Academic Snapshot */}
        {currentStep === 3 && user && (
          <AcademicSnapshotStep 
            academicInfo={data.academicInfo}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(academicInfo) => updateData({ academicInfo })}
            step={4}
          />
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && user && (
          <PaymentStep 
            paymentInfo={data.paymentInfo}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(paymentInfo) => updateData({ paymentInfo })}
            step={5}
          />
        )}

        {/* Step 5: Loading */}
        {currentStep === 5 && user && (
          <LoadingStep 
            userData={data}
            user={user}
            onComplete={handleOnboardingComplete}
          />
        )}

        {/* Loading state for user data */}
        {currentStep >= 0 && !user && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user data...</p>
            </div>
          </div>
        )}

        {/* Error fallback */}
        {currentStep < 0 && !showAuthModal && (
          <div className="text-center p-8">
            <div className="text-red-600 font-bold mb-4">⚠️ UNEXPECTED STATE</div>
            <p className="mb-4">
              Current step: {currentStep}, User: {user ? 'exists' : 'null'}, 
              Session: {session ? 'exists' : 'null'}
            </p>
            <button 
              onClick={() => {
                if (session?.user) {
                  setUser(session);
                  setCurrentStep(0);
                } else {
                  setShowAuthModal(true);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reset Flow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};