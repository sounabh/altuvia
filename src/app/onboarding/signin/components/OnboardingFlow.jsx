"use client";

import { useState, useEffect, useCallback } from "react";

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
  // Track current step index (starts at -1 to show Auth Modal first)
  const [currentStep, setCurrentStep] = useState(-1);

  // Auth Modal visibility state
  const [showAuthModal, setShowAuthModal] = useState(true);

  // Store user information from authentication
  const [user, setUser] = useState(null);

  // Add a force render counter to help with state issues
  const [renderKey, setRenderKey] = useState(0);

  // Centralized data state for user input across all steps
  const [data, setData] = useState({
    countries: [],
    courses: [],
    studyLevel: "",
    academicInfo: {}
  });

  // List of step names for ProgressIndicator
  const steps = [
    "Welcome",
    "Countries", 
    "Courses",
    "Study Level",
    "Academic Info",
    "Payment",
    "Loading"
  ];

  // Debug: Log whenever currentStep changes
  useEffect(() => {
    console.log('🔄 Step changed to:', currentStep, 'Step name:', steps[currentStep] || 'Auth');
  }, [currentStep, steps]);

  // Called when authentication is successful
  const handleAuthSuccess = useCallback((sessionData) => {
    console.log('🔐 handleAuthSuccess called with:', sessionData);
    
    // Use functional updates to avoid stale closures
    setShowAuthModal(false);
    setUser(sessionData?.user || null);
    setCurrentStep(0);
    setRenderKey(prev => prev + 1); // Force re-render
    
    console.log('✅ Authentication successful, moving to Welcome step');
  }, []);

  // Move to the next step - using useCallback to prevent recreation
  const handleNext = useCallback(() => {
    console.log('🚀 handleNext called - Current step:', currentStep);
    
    setCurrentStep(prevStep => {
      const nextStep = prevStep + 1;
      console.log('📍 Moving from step:', prevStep, 'to step:', nextStep);
      
      if (nextStep < steps.length) {
        console.log('✅ Step transition allowed');
        // Also trigger a render key change to force update
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
      if (prevStep > 0) {
        const backStep = prevStep - 1;
        console.log('📍 Moving back to step:', backStep);
        setRenderKey(prev => prev + 1);
        return backStep;
      } else {
        console.log('❌ Cannot go back - already at first step');
        return prevStep;
      }
    });
  }, []);

  // Update the shared user data
  const updateData = useCallback((newData) => {
    console.log('💾 Updating data with:', newData);
    setData(prev => {
      const updated = { ...prev, ...newData };
      console.log('📋 Updated data state:', updated);
      return updated;
    });
  }, []);

  // Emergency step setter for debugging
  const setStepDirectly = useCallback((stepIndex) => {
    console.log('🆘 Emergency step change to:', stepIndex);
    setCurrentStep(stepIndex);
    setRenderKey(prev => prev + 1);
  }, []);

  console.log('🎬 OnboardingFlow render - Current step:', currentStep, 'Render key:', renderKey);

  return (
    <div className="h-screen" key={renderKey}>

      {/* --------------------------- */}
      {/* Authentication Modal       */}
      {/* --------------------------- */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* --------------------------- */}
      {/* Progress Indicator Bar     */}
      {/* Hidden for last step       */}
      {/* --------------------------- */}
      {currentStep >= 0 && currentStep < steps.length - 1 && (
        <ProgressIndicator 
          currentStep={currentStep} 
          totalSteps={steps.length - 1}
          stepNames={steps.slice(0, -1)} // exclude loading from progress bar
        />
      )}

      {/* --------------------------- */}
      {/* Step Components Rendered   */}
      {/* --------------------------- */}
      <div className="pt-20">
        {/* Welcome Step */}
        {currentStep === 0 && (
          <div key="welcome-step">
            <WelcomeStep 
              onNext={handleNext} 
              user={user}
            />
          </div>
        )}

        {/* Country Selection Step */}
        {currentStep === 1 && (
          <div key="country-step">
            <CountrySelectionStep 
              selectedCountries={data.countries}
              onNext={handleNext}
              onBack={handleBack}
              onUpdate={(countries) => updateData({ countries })}
            />
          </div>
        )}

        {/* Course Selection Step */}
        {currentStep === 2 && (
          <div key="course-step">
            <CourseSelectionStep 
              selectedCourses={data.courses}
              onNext={handleNext}
              onBack={handleBack}
              onUpdate={(courses) => updateData({ courses })}
            />
          </div>
        )}

        {/* Study Level Step */}
        {currentStep === 3 && (
          <StudyLevelStep 
            selectedLevel={data.studyLevel}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(studyLevel) => updateData({ studyLevel })}
          />
        )}

        {/* Academic Snapshot Step */}
        {currentStep === 4 && (
          <AcademicSnapshotStep 
            academicInfo={data.academicInfo}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(academicInfo) => updateData({ academicInfo })}
          />
        )}

        {/* Payment Step */}
        {currentStep === 5 && (
          <PaymentStep 
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {/* Loading Step */}
        {currentStep === 6 && (
          <LoadingStep />
        )}

        {/* Fallback for unexpected states */}
        {currentStep < 0 && !showAuthModal && (
          <div className="text-center p-8">
            <div className="text-red-600 font-bold mb-4">⚠️ UNEXPECTED STATE</div>
            <button 
              onClick={() => setStepDirectly(0)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Go to Welcome Step
            </button>
          </div>
        )}
      </div>
    </div>
  );
};