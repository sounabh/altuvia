import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// =============================================================================
// COURSE DATA CONSTANTS
// =============================================================================
/**
 * List of available courses with visual icons (emojis)
 * 
 * Structure:
 *   - name: Full course name
 *   - icon: Emoji representing the course for visual recognition
 * 
 * Note: Emojis provide quick visual appeal and recognition
 */
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

// =============================================================================
// CourseSelectionStep Component
// =============================================================================
/**
 * CourseSelectionStep - Form step for selecting preferred study subjects
 * 
 * Features:
 * - Allows selection of up to 3 courses
 * - Displays courses with emoji icons for visual recognition
 * - Provides visual feedback for selection state
 * - Includes navigation controls
 * 
 * @param {Object} props - Component properties
 * @param {string[]} [props.selectedCourses=[]] - Pre-selected course names
 * @param {Function} [props.onNext=() => {}] - Callback when proceeding to next step
 * @param {Function} [props.onBack=() => {}] - Callback when returning to previous step
 * @param {Function} [props.onUpdate=() => {}] - Callback when updating course selection
 * @param {number} props.step - Current step number
 * @param {Object} props.user - User data object
 * @returns {JSX.Element} Course selection interface
 */
export const CourseSelectionStep = ({
  selectedCourses = [],
  onNext = () => {},
  onBack = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  /**
   * Toggles course selection state
   * 
   * Rules:
   * - If course is already selected, removes it
   * - If course is not selected and less than 3 selected, adds it
   * - Prevents selection when 3 courses already chosen
   * 
   * @param {string} courseName - Name of course to toggle
   */
  const toggleCourse = (courseName) => {
    if (selectedCourses.includes(courseName)) {
      // Remove course from selection
      onUpdate(selectedCourses.filter((c) => c !== courseName));
    } else if (selectedCourses.length < 3) {
      // Add course to selection
      onUpdate([...selectedCourses, courseName]);
    }
  };

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================
  /**
   * Generates user initials for avatar fallback
   * 
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
        <span className="font-roboto font-semibold tracking-[0.7px] leading-[28.8px] text-[22px] text-white]">
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
            Select up to 3 subjects where you'd like to focus your studies
          </p>
        </div>

        {/* COURSE SELECTION GRID */}
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
                  {/* COURSE ICON CARD */}
                  <div
                    onClick={() => !isDisabled && toggleCourse(course.name)}
                    className={`w-20 h-20 rounded-2xl transition-all duration-300 transform cursor-pointer overflow-hidden flex items-center justify-center ${
                      isSelected
                        ? "border-4 border-[#002147] shadow-xl scale-110 bg-white"
                        : "border-4 border-gray-300 hover:border-[#002147] hover:shadow-lg hover:scale-105 bg-white"
                    } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    {/* Emoji icon for visual representation */}
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

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center w-full max-w-6xl px-4 mt-8 z-10 pb-20">
          {/* BACK BUTTON */}
          <Button
            onClick={onBack}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-l ml-36"
          >
            <span className="mr-2">←</span> 
            Back
          </Button>
          
          {/* NEXT BUTTON */}
          <Button
            onClick={onNext}
            disabled={selectedCourses.length === 0}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg mr-36"
          >
            Next 
            <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Demo Wrapper Component
// =============================================================================
/**
 * DemoWrapper - Standalone component for development/testing
 * 
 * Manages state for:
 *   - selectedCourses: Currently selected course names
 * 
 * Note: Used for isolated component testing
 */
export default function CourseSelectionDemo() {
  // State for selected courses
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