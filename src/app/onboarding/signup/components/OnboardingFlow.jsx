"use client"

import { useState } from "react";
import { AuthModal } from "./AuthModal";
import { WelcomeStep } from "./Welcome";
import { CountrySelectionStep } from "./CountrySelection";
import { CourseSelectionStep } from "./CourseSelection";
import { StudyLevelStep } from "./StudyLevel";
import { AcademicSnapshotStep } from "./AcademicSnapshot";
import { PaymentStep } from "./PaymentSteps";
import { LoadingStep } from "./Loading";
import { ProgressIndicator } from "./ProgressIndicator";

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(-1); // Start with -1 for auth modal
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [data, setData] = useState({
    countries: [],
    courses: [],
    studyLevel: "",
    academicInfo: {}
  });

  const steps = [
    "Welcome",
    "Countries",
    "Courses", 
    "Study Level",
    "Academic Info",
    "Payment",
    "Loading"
  ];

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setCurrentStep(0); // Move to welcome step
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (newData) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  return (
    <div className="min-h-screen ">
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {currentStep >= 0 && currentStep < steps.length - 1 && (
        <ProgressIndicator 
          currentStep={currentStep} 
          totalSteps={steps.length - 1}
          stepNames={steps.slice(0, -1)}
        />
      )}
      
      <div className="pt-20">
        {currentStep === 0 && (
          <WelcomeStep onNext={handleNext} />
        )}
        {currentStep === 1 && (
          <CountrySelectionStep 
            selectedCountries={data.countries}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(countries) => updateData({ countries })}
          />
        )}
        {currentStep === 2 && (
          <CourseSelectionStep 
            selectedCourses={data.courses}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(courses) => updateData({ courses })}
          />
        )}
        {currentStep === 3 && (
          <StudyLevelStep 
            selectedLevel={data.studyLevel}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(studyLevel) => updateData({ studyLevel })}
          />
        )}
        {currentStep === 4 && (
          <AcademicSnapshotStep 
            academicInfo={data.academicInfo}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(academicInfo) => updateData({ academicInfo })}
          />
        )}
        {currentStep === 5 && (
          <PaymentStep 
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 6 && (
          <LoadingStep />
        )}
      </div>
    </div>
  );
};