import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// =============================================================================
// AcademicSnapshotStep Component
// =============================================================================
/**
 * AcademicSnapshotStep - Form step for collecting academic information during onboarding
 * 
 * @param {Object} props - Component properties
 * @param {Object} [props.academicInfo={}] - Initial academic information
 * @param {Function} [props.onNext=() => {}] - Callback when proceeding to next step
 * @param {Function} [props.onBack=() => {}] - Callback when returning to previous step
 * @param {Function} [props.onUpdate=() => {}] - Callback when updating form data
 * @param {number} props.step - Current step number
 * @param {Object} props.user - User data object
 * @returns {JSX.Element} Academic information form interface
 */
export const AcademicSnapshotStep = ({
  academicInfo = {},
  onNext = () => {},
  onBack = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  /**
   * Form data state with initial values from props
   * @type {[Object, Function]} Tuple containing form data and setter
   */
  const [formData, setFormData] = useState(academicInfo);

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  /**
   * Handles input field changes and updates form state
   * 
   * @param {string} field - Field name to update
   * @param {string} value - New value for the field
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handles skip action - proceeds without saving data
   */
  const handleSkip = () => {
    onNext();
  };

  /**
   * Handles form submission:
   * 1. Updates parent component with current form data
   * 2. Proceeds to next step
   */
  const handleSubmit = () => {
    onUpdate(formData);
    onNext();
  };

  /**
   * Handles back navigation - returns to previous step
   */
  const handleBack = () => {
    onBack();
  };

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================
  /**
   * Generates user initials for avatar fallback
   * Fallback hierarchy:
   * 1. First letters of first and last name
   * 2. First letter of email
   * 3. Default 'U' if no user data
   * 
   * @returns {string} User initials in uppercase
   */
  const getUserInitials = () => {
    // Handle full name if available
    if (user?.user.name) {
      const names = user?.user.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    
    // Fallback to email if name not available
    if (user?.user.email) {
      return user?.user.name[0].toUpperCase();
    }
    
    // Ultimate fallback
    return 'U';
  };

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================
  return (
    <div className="min-h-screen w-fit max-w-none">
      <div className="relative z-100 flex flex-col justify-center items-center px-8 py-4 -my-20">
        {/* HEADER SECTION: Logo and user avatar */}
        <header className="bg-[#002147] w-[95%] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between">
           <span className="font-roboto font-semibold tracking-[0.7px] leading-[28.8px] text-[22px] text-white">
              Altu<span className="text-[#3598FE]">Via</span>
            </span>
          
          {/* USER AVATAR: With fallback to initials */}
          <div className="relative">
            {user?.user.image ? (
              <img
                src={user?.user.image}
                alt={`${user?.user.name || 'User'} avatar`}
                className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                onError={(e) => {
                  // Fallback mechanism: Hide broken image and show initials
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* FALLBACK AVATAR: Shows user initials */}
            <div 
              className={`w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm ${user?.user.image ? 'hidden' : 'flex'}`}
            >
              {getUserInitials()}
            </div>
          </div>
        </header>

        {/* DECORATIVE BACKGROUND ELEMENTS */}
        <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>
        <div className="absolute top-[18%] left-0 w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>

        {/* WELCOME MESSAGE SECTION */}
        <div className="text-center flex flex-col gap-5 items-center justify-center space-y-4 mb-6 mt-6 w-[80%] mx-auto">
          <h1 className="text-[2.2rem] tracking-normal font-normal leading-12 font-roboto text-black z-10">
            <span className="text-[#8a99aa]"> Welcome </span> {user?.user.name} ! We are
            thrilled to have you here. Discover the world's leading universities
            to shape your academic journey.
          </h1>
          <p className="text-xl font font-normal tracking-normal leading-7 text-black z-10">
            Shape your future! Choose your country, subject and Degree Level to
            unlock tailoured study oppurtunities. Takes about 1-2 minutes
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div className="text-center mb-8 mt-10">
          <div className="inline-flex items-center bg-blue-100 text-black px-4 py-2 rounded-lg font-semibold text-sm mb-4">
             Step {`0${step}`} 
          </div>
          <p className="text-sm text-black font-medium mb-5 z-10">
            Share your academic details
          </p>
        </div>

        {/* FORM SECTION: Academic information inputs */}
        <div className="mb-8 flex justify-center z-10 w-full">
          <div className="bg-white p-8 rounded-2xl  shadow-xl w-full max-w-4xl">
            <div className="space-y-6">
              {/* GPA INPUT */}
              <div className="space-y-2">
                <Label
                  htmlFor="gpa"
                  className="text-sm font-normal font-roboto text-black"
                >
                  GPA / Academic Performance
                </Label>
                <Input
                  id="gpa"
                  placeholder="e.g., 3.7/4.0 or 85%"
                  value={formData.gpa || ""}
                  onChange={(e) => handleInputChange("gpa", e.target.value)}
                  className="text-lg p-4 rounded-md border border-gray-400 focus:border-[#002147] bg-white"
                />
              </div>

              {/* TEST SCORES INPUT */}
              <div className="space-y-2">
                <Label
                  htmlFor="testScores"
                  className="text-sm font-normal font-roboto text-black"
                >
                  Test Scores (SAT, ACT, GRE, GMAT, etc.)
                </Label>
                <Input
                  id="testScores"
                  placeholder="e.g., SAT: 1450, IELTS: 7.5"
                  value={formData.testScores || ""}
                  onChange={(e) => handleInputChange("testScores", e.target.value)}
                  className="text-lg p-4 rounded-md border border-gray-400 focus:border-[#002147] bg-white"
                />
              </div>

              {/* WORK EXPERIENCE TEXTAREA */}
              <div className="space-y-2">
                <Label
                  htmlFor="workExperience"
                  className="text-sm font-normal font-roboto text-black"
                >
                  Work Experience (optional)
                </Label>
                <Textarea
                  id="workExperience"
                  placeholder="Brief description of relevant work experience..."
                  value={formData.workExperience || ""}
                  onChange={(e) =>
                    handleInputChange("workExperience", e.target.value)
                  }
                  className="text-lg p-4 rounded-md border border-gray-400 focus:border-[#002147] bg-white h-24 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center w-full max-w-6xl px-4 mt-8 z-10 pb-20">
          <Button
            onClick={handleBack}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-l ml-36"
          >
            Back
            <span className="ml-2">←</span>
          </Button>
          
          <div className="flex gap-3 mr-36">
            <Button
              onClick={handleSkip}
              className="bg-transparent border-2 border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white px-11 py-6 rounded-lg transition-all duration-300 text-lg font-normal font-roboto shadow-lg"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg"
            >
              Enter Details 
              <span className="ml-2">→</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Demo Wrapper Component (For development/testing)
// =============================================================================
export default function AcademicSnapshotDemo() {
  const [academicInfo, setAcademicInfo] = useState({});

  return (
    <AcademicSnapshotStep
      academicInfo={academicInfo}
      onUpdate={setAcademicInfo}
      onNext={() => console.log("Next clicked with:", academicInfo)}
      onBack={() => console.log("Back clicked")}
    />
  );
}