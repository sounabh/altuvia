import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// -----------------------------------------------------------------------------
// List of courses with icons (emoji for quick visual appeal)
// -----------------------------------------------------------------------------
const courses = [
  { name: "Computer Science", icon: "💻" },
  { name: "Business & Management", icon: "📊" },
  { name: "Engineering", icon: "⚙️" },
  { name: "Medicine", icon: "🏥" },
  { name: "Law", icon: "⚖️" },
  { name: "Psychology", icon: "🧠" },
  { name: "Economics", icon: "📈" },
  { name: "Data Science", icon: "📊" },
  { name: "Design", icon: "🎨" },
  { name: "Architecture", icon: "🏛️" },
  { name: "Finance", icon: "💰" },
  { name: "Marketing", icon: "📢" },
  { name: "International Relations", icon: "🌍" },
  { name: "Environmental Science", icon: "🌱" },
  { name: "Mathematics", icon: "🔢" },
  { name: "Physics", icon: "⚛️" },
  { name: "Chemistry", icon: "🧪" },
  { name: "Biology", icon: "🔬" },
  { name: "History", icon: "📚" },
  { name: "Philosophy", icon: "🤔" },
  { name: "Literature", icon: "📖" },
  { name: "Linguistics", icon: "🗣️" },
  { name: "Sociology", icon: "👥" },
  { name: "Political Science", icon: "🏛️" }
];

// -----------------------------------------------------------------------------
// CourseSelectionStep Component
// - Handles course selection (max 3)
// - Displays emoji icons and next/back buttons
// -----------------------------------------------------------------------------
export const CourseSelectionStep = ({
  selectedCourses = [],
  onNext = () => {},
  onBack = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  // Toggle a course in the selection list
  const toggleCourse = (courseName) => {
    if (selectedCourses.includes(courseName)) {
      onUpdate(selectedCourses.filter((c) => c !== courseName));
    } else if (selectedCourses.length < 3) {
      onUpdate([...selectedCourses, courseName]);
    }
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

  return (
    <div className="min-h-screen w-fit max-w-none">
      <div className="relative z-100 flex flex-col justify-center items-center px-8 py-4 -my-20">
        {/* Header - Fixed width to match StudyLevelStep */}
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

        {/* Decorative background blobs */}
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

        {/* Step indicator and selection count */}
        <div className="text-center mb-8 mt-10">
          <div className="inline-flex items-center bg-blue-100 text-black px-4 py-2 rounded-lg font-semibold text-sm mb-4">
             Step {`0${step}`} 
          </div>
          <p className="text-sm text-black font-medium mb-5 z-10">
            Select up to 3 subjects where you'd like to focus your studies
          </p>
        </div>

        {/* Course selection grid */}
        <div className="mb-12 flex justify-center z-10">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center max-w-6xl">
            {courses.map((course) => {
              const isSelected = selectedCourses.includes(course.name);
              const isDisabled = !isSelected && selectedCourses.length >= 3;

              return (
                <div
                  key={course.name}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    onClick={() => !isDisabled && toggleCourse(course.name)}
                    className={`w-20 h-20 rounded-2xl transition-all duration-300 transform cursor-pointer overflow-hidden flex items-center justify-center ${
                      isSelected
                        ? "border-4 border-[#002147] shadow-xl scale-110 bg-white"
                        : "border-4 border-gray-300 hover:border-[#002147] hover:shadow-lg hover:scale-105 bg-white"
                    } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-4xl">{course.icon}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center max-w-20 leading-tight">
                    {course.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation buttons - positioned relative to the grid */}
        <div className="flex justify-between items-center w-full max-w-6xl px-4 mt-8 z-10 pb-20">
          <Button
            onClick={onBack}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-l ml-36"
          >
            
            Back
         <span className="mr-2">←</span> 

          </Button>
          
          <Button
            onClick={onNext}
            disabled={selectedCourses.length === 0}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg mr-36"
          >
            Next <span className="">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Demo Wrapper Component
// - Controls state and shows the step
// -----------------------------------------------------------------------------
export default function CourseSelectionDemo() {
  const [selectedCourses, setSelectedCourses] = useState([]);

  return (
    <CourseSelectionStep
      selectedCourses={selectedCourses}
      onUpdate={setSelectedCourses}
      onNext={() => console.log("Next clicked with:", selectedCourses)}
      onBack={() => console.log("Back clicked")}
    />
  );
}