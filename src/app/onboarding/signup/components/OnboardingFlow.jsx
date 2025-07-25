"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// Step Components
import { AuthModal } from "./AuthModal";
import { WelcomeStep } from "./Welcome";
import { CountrySelectionStep } from "./CountrySelection";
import { CourseSelectionStep } from "./CourseSelection";
import { StudyLevelStep } from "./StudyLevel";
import { AcademicSnapshotStep } from "./AcademicSnapshot";
import { PaymentStep } from "./PaymentSteps";
import { LoadingStep } from "./Loading";
import { ProgressIndicator } from "./ProgressIndicator";

// -----------------------------------------------------------------------------
// OnboardingFlow: Handles multi-step user onboarding with authentication,
// data collection, and optional payment step.
// -----------------------------------------------------------------------------

export const OnboardingFlow = () => {
  // Get session from NextAuth
  const { data: session, status } = useSession();

  // Track current step index
  const [currentStep, setCurrentStep] = useState(-1);

  // Auth Modal visibility state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Store user information from authentication
  const [user, setUser] = useState(null);

  // Add a force render counter to help with state issues
  const [renderKey, setRenderKey] = useState(0);

  // Centralized data state for user input across all steps
  const [data, setData] = useState({
    countries: [],
    courses: [],
    studyLevel: "",
    academicInfo: {},
    paymentInfo: {}  
  });

  // List of step names for ProgressIndicator
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
    if (status === "loading") {
      // Still checking authentication status
      return;
    }

    if (session && session.user) {
      // User is already logged in - skip auth modal and welcome step
      console.log('✅ User already authenticated, skipping to Country selection');
      console.log('👤 Session user data:', session.user);
      setUser(session.user);
      setShowAuthModal(false);
      setCurrentStep(1); // Start at Country Selection (index 1)
    } else {
      // User is not logged in - show auth modal
      console.log('🔐 No session found, showing auth modal');
      setShowAuthModal(true);
      setCurrentStep(-1);
      setUser(null); // Explicitly set user to null
    }
  }, [session, status]);

  // Called when authentication is successful (only for new logins)
  const handleAuthSuccess = useCallback((sessionData) => {
    console.log('🔐 handleAuthSuccess called with:', sessionData);
    
    setShowAuthModal(false);
    setUser(sessionData?.user || null);
    setCurrentStep(0); // New users go to Welcome step first
    setRenderKey(prev => prev + 1);
    
    console.log('✅ New authentication successful, moving to Welcome step');
  }, []);

  // Move to the next step - using useCallback to prevent recreation
  const handleNext = useCallback(() => {
    console.log('🚀 handleNext called - Current step:', currentStep);
    
    setCurrentStep(prevStep => {
      const nextStep = prevStep + 1;
      console.log('📍 Moving from step:', prevStep, 'to step:', nextStep);
      
      if (nextStep < steps.length) {
        console.log('✅ Step transition allowed');
        setRenderKey(prev => prev + 1);
        return nextStep;
      } else {
        console.log('❌ Cannot proceed - already at last step');
        return prevStep;
      }
    });
  }, [steps.length]);

  // Move to the previous step
  const handleBack = useCallback(() => {
    console.log('⬅️ handleBack called');
    
    setCurrentStep(prevStep => {
      // For existing users, don't go back past Country Selection (step 1)
      const minStep = session && session.user ? 1 : 0;
      
      if (prevStep > minStep) {
        const backStep = prevStep - 1;
        console.log('📍 Moving back to step:', backStep);
        setRenderKey(prev => prev + 1);
        return backStep;
      } else {
        console.log('❌ Cannot go back - already at minimum step');
        return prevStep;
      }
    });
  }, [session]);

  // Update the shared user data
  const updateData = useCallback((newData) => {
    console.log('💾 Updating data with:', newData);
    setData(prev => {
      const updated = { ...prev, ...newData };
      console.log('📋 Updated data state:', updated);
      return updated;
    });
  }, []);

  // Show loading while checking authentication status
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

  // Add debug logging for current state
  console.log('🎬 OnboardingFlow render - Current step:', currentStep, 'User:', user, 'Session:', !!session);

  return (
    <div className="h-screen" key={renderKey}>

      {/* --------------------------- */}
      {/* Progress Indicator Bar     */}
      {/* Hidden for last step       */}
      {/* --------------------------- */}
      
     

      {/* --------------------------- */}
      {/* Step Components Rendered   */}
      {/* --------------------------- */}

      <div className="pt-20">
        {/* Authentication Modal - Only shown for new users */}
        {showAuthModal && !session && (
          <AuthModal 
            isOpen={showAuthModal}
            user={user}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
        {/* Welcome Step - Only for new users */}
        {currentStep === 0 && user && (
          <div key="welcome-step">
            <WelcomeStep 
              user={user}
              onNext={handleNext}
            />
          </div>
        )}

        {/* Country Selection Step - Only render if user is available */}
        {currentStep === 1 && user && (
          <div key="country-step">
            <CountrySelectionStep 
              selectedCountries={data.countries}
              user={user}
              onNext={handleNext}
              onBack={handleBack}
              onUpdate={(countries) => updateData({ countries })}
              step={1}
            />
          </div>
        )}

        {/* Course Selection Step */}
        {currentStep === 2 && user && (
          <div key="course-step">
            <CourseSelectionStep 
              selectedCourses={data.courses}
              user={user}
              onNext={handleNext}
              onBack={handleBack}
              onUpdate={(courses) => updateData({ courses })}
              step={2}
            />
          </div>
        )}

        {/* Study Level Step */}
        {currentStep === 3 && user && (
          <StudyLevelStep 
            selectedLevel={data.studyLevel}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(studyLevel) => updateData({ studyLevel })}
            step={3}
          />
        )}

        {/* Academic Snapshot Step */}
        {currentStep === 4 && user && (
          <AcademicSnapshotStep 
            academicInfo={data.academicInfo}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(academicInfo) => updateData({ academicInfo })}
            step={4}
          />
        )}

        {/* Payment Step */}
        {currentStep === 5 && user && (
          <PaymentStep 
            paymentInfo={data.paymentInfo}
            user={user}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(paymentInfo) => updateData({ paymentInfo })}
            step={5}
          />
        )}

        {/* Loading Step */}
        {currentStep === 6 && user && (
          <LoadingStep 
            userData={data}
            user={user}
          />
        )}

        {/* Auth Modal also gets user data when available */}

        {/* Show loading if we're waiting for user state to be set */}
        {currentStep >= 0 && !user && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user data...</p>
            </div>
          </div>
        )}

        {/* Fallback for unexpected states */}
        {currentStep < 0 && !showAuthModal && (
          <div className="text-center p-8">
            <div className="text-red-600 font-bold mb-4">⚠️ UNEXPECTED STATE</div>
            <p className="mb-4">Current step: {currentStep}, User: {user ? 'exists' : 'null'}, Session: {session ? 'exists' : 'null'}</p>
            <button 
              onClick={() => {
                if (session && session.user) {
                  setUser(session.user);
                  setCurrentStep(1);
                } else {
                  setCurrentStep(0);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {session ? 'Go to Country Selection' : 'Go to Welcome Step'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};