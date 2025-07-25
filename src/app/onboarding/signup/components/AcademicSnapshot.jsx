import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// -----------------------------------------------------------------------------
// AcademicSnapshotStep Component
// -----------------------------------------------------------------------------
export const AcademicSnapshotStep = ({
  academicInfo = {},
  onNext = () => {},
  onBack = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  const [formData, setFormData] = useState(academicInfo);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkip = () => {
    onNext();
  };

  const handleSubmit = () => {
    onUpdate(formData);
    onNext();
  };

  const handleBack = () => {
    onBack();
  };


 // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };


  // ---------------------------------------------------------------------------
  // Render - Updated to match StudyLevelStep styling
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-fit max-w-none">
      <div className="relative z-100 flex flex-col justify-center items-center px-8 py-4 -my-20">
        {/* Header - logo and avatar */}
       <header className="bg-[#002147] w-[95%] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between">
          <div className="text-white text-xl font-semibold">Logo</div>
          
          {/* User Avatar with blue border */}
          <div className="relative">
            {user?.image ? (
              <img
                src={user.image}
                alt={`${user.name || 'User'} avatar`}
                className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback avatar with user initials */}
            <div 
              className={`w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm ${user?.image ? 'hidden' : 'flex'}`}
            >
              {getUserInitials()}
            </div>
          </div>
        </header>

        {/* Decorative background blobs - Same as StudyLevelStep */}
        <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>
        <div className="absolute top-[18%] left-0 w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>

        {/* Welcome text section */}
        <div className="text-center flex flex-col gap-5 items-center justify-center space-y-4 mb-6 mt-6 w-[80%] mx-auto">
          <h1 className="text-[2.2rem] tracking-normal font-normal leading-12 font-roboto text-black z-10">
            <span className="text-[#8a99aa]"> Welcome </span> Martin! We are
            thrilled to have you here. Discover the world's leading universities
            to shape your academic journey.
          </h1>
          <p className="text-xl font font-normal tracking-normal leading-7 text-black z-10">
            Shape your future! Choose your country, subject and Degree Level to
            unlock tailoured study oppurtunities. Takes about 1-2 minutes
          </p>
        </div>

        {/* Step indicator - Same as StudyLevelStep */}
        <div className="text-center mb-8 mt-10">
          <div className="inline-flex items-center bg-blue-100 text-black px-4 py-2 rounded-lg font-semibold text-sm mb-4">
             Step {`0${step}`} 
          </div>
          <p className="text-sm text-black font-medium mb-5 z-10">
            Share your academic details
          </p>
        </div>

        {/* Form card - Styled to match StudyLevelStep cards */}
        <div className="mb-8 flex justify-center z-10 w-full">
          <div className="bg-white p-8 rounded-2xl  shadow-xl w-full max-w-4xl">
            <div className="space-y-6">
              {/* GPA */}
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

              {/* Test Scores */}
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

              {/* Work Experience */}
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

        {/* Navigation buttons - Fixed to match StudyLevelStep */}
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

// -----------------------------------------------------------------------------
// Demo Wrapper Component
// -----------------------------------------------------------------------------
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