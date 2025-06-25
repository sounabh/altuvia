import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";



export const AcademicSnapshotStep = ({ academicInfo, onNext, onBack, onUpdate }) => {
  const [formData, setFormData] = useState(academicInfo);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleSkip = () => {
    onNext();
  };

  const handleSubmit = () => {
    onNext();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            Quick Academic Snapshot
          </h1>
          <p className="text-xl text-gray-600">
            Help us find your best-fit universities (takes 10 seconds)
          </p>
          <p className="text-sm text-gray-500">
            This information helps us provide more accurate recommendations
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gpa" className="text-sm font-medium text-gray-700">
                GPA / Academic Performance
              </Label>
              <Input
                id="gpa"
                placeholder="e.g., 3.7/4.0 or 85%"
                value={formData.gpa || ""}
                onChange={(e) => handleInputChange("gpa", e.target.value)}
                className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testScores" className="text-sm font-medium text-gray-700">
                Test Scores (SAT, ACT, GRE, GMAT, etc.)
              </Label>
              <Input
                id="testScores"
                placeholder="e.g., SAT: 1450, IELTS: 7.5"
                value={formData.testScores || ""}
                onChange={(e) => handleInputChange("testScores", e.target.value)}
                className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workExperience" className="text-sm font-medium text-gray-700">
                Work Experience (optional)
              </Label>
              <Textarea
                id="workExperience"
                placeholder="Brief description of relevant work experience..."
                value={formData.workExperience || ""}
                onChange={(e) => handleInputChange("workExperience", e.target.value)}
                className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 h-24 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[#002147] text-white px-8 py-3 rounded-xl transition-all duration-300"
              >
                Enter Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};