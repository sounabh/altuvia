import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  { name: "Physics", icon: "⚛️" }
];

// -----------------------------------------------------------------------------
// CourseSelectionStep Component
// Props:
// - selectedCourses: current selected subjects
// - onNext: moves to next step
// - onBack: goes to previous step
// - onUpdate: updates the selected subjects list
// -----------------------------------------------------------------------------
export const CourseSelectionStep = ({ selectedCourses, onNext, onBack, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter courses dynamically based on search input (case-insensitive)
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle selection state for a course (max 3 selections allowed)
  const toggleCourse = (courseName) => {
    if (selectedCourses.includes(courseName)) {
      // Deselect if already selected
      onUpdate(selectedCourses.filter(c => c !== courseName));
    } else if (selectedCourses.length < 3) {
      // Select only if under the limit
      onUpdate([...selectedCourses, courseName]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

        {/* -------------------------- */}
        {/* Header / Instruction Text */}
        {/* -------------------------- */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            What would you like to study?
          </h1>
          <p className="text-xl text-gray-600">
            Select up to 3 subjects that interest you
          </p>

          {/* Show count of selected courses */}
          <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
            {selectedCourses.length} of 3 selected
          </div>
        </div>

        {/* -------------------------- */}
        {/* Card with Search + Grid    */}
        {/* -------------------------- */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">

          {/* Course search input */}
          <Input
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-6 text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-purple-400"
          />

          {/* Grid of course buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {filteredCourses.map((course) => (
              <button
                key={course.name}
                onClick={() => toggleCourse(course.name)}
                disabled={
                  !selectedCourses.includes(course.name) &&
                  selectedCourses.length >= 3
                }
                className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedCourses.includes(course.name)
                    ? "border-purple-500 bg-purple-50 shadow-lg scale-105"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md"
                } ${
                  !selectedCourses.includes(course.name) &&
                  selectedCourses.length >= 3
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="text-3xl mb-2">{course.icon}</div>
                <div className="font-medium text-sm text-gray-800 text-center">
                  {course.name}
                </div>
              </button>
            ))}
          </div>

          {/* -------------------------- */}
          {/* Navigation Buttons         */}
          {/* -------------------------- */}
          <div className="flex justify-between">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {/* Next Button (disabled if none selected) */}
            <Button
              onClick={onNext}
              disabled={selectedCourses.length === 0}
              className="bg-[#002147] text-white px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              Next Step
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
