import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";


const countries = [
  { name: "United States", flag: "🇺🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "France", flag: "🇫🇷" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Finland", flag: "🇫🇮" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "New Zealand", flag: "🇳🇿" }
];

export const CountrySelectionStep = ({ selectedCountries, onNext, onBack, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCountry = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      onUpdate(selectedCountries.filter(c => c !== countryName));
    } else if (selectedCountries.length < 3) {
      onUpdate([...selectedCountries, countryName]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            Which countries interest you?
          </h1>
          <p className="text-xl text-gray-600">
            Select up to 3 countries where you'd like to study
          </p>
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
            {selectedCountries.length} of 3 selected
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <Input
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-6 text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-purple-400"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {filteredCountries.map((country) => (
              <button
                key={country.name}
                onClick={() => toggleCountry(country.name)}
                disabled={!selectedCountries.includes(country.name) && selectedCountries.length >= 3}
                className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedCountries.includes(country.name)
                    ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md"
                } ${
                  !selectedCountries.includes(country.name) && selectedCountries.length >= 3
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="text-3xl mb-2">{country.flag}</div>
                <div className="font-medium text-sm text-gray-800">{country.name}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={onNext}
              disabled={selectedCountries.length === 0}
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
