import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

// -----------------------------------------------------------------------------
// List of countries with corresponding flag emojis
// Used for country selection UI - Limited to 16 countries (2 rows of 8)
// -----------------------------------------------------------------------------
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
  { name: "New Zealand", flag: "🇳🇿" },
];

// -----------------------------------------------------------------------------
// CountrySelectionStep Component
// Props:
// - selectedCountries: array of selected country names
// - onNext: callback to move to next step
// - onBack: callback to move to previous step
// - onUpdate: callback to update selected countries
// -----------------------------------------------------------------------------
export const CountrySelectionStep = ({
  selectedCountries = [],
  onNext = () => {},
  onBack = () => {},
  onUpdate = () => {},
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter countries based on search input (case-insensitive)
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add or remove a country from selection with console logging
  const toggleCountry = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      // If already selected, remove it
      const updatedCountries = selectedCountries.filter(
        (c) => c !== countryName
      );
      console.log(`❌ Country deselected: ${countryName}`);
      console.log(`📋 Updated selection:`, updatedCountries);
      onUpdate(updatedCountries);
    } else if (selectedCountries.length < 3) {
      // Allow up to 3 countries to be selected
      const updatedCountries = [...selectedCountries, countryName];
      console.log(`✅ Country selected: ${countryName}`);
      console.log(`📋 Updated selection:`, updatedCountries);
      onUpdate(updatedCountries);
    } else {
      // Maximum limit reached
      console.log(
        `⚠️ Maximum limit reached. Cannot select ${countryName}. Current selection:`,
        selectedCountries
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        {/* ======================================= */}
        {/* HEADER SECTION - Title & Instructions  */}
        {/* ======================================= */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Which countries interest you?
          </h1>

          <p className="text-xl text-gray-600 mb-6">
            Select up to 3 countries where you'd like to study
          </p>

          {/* Selection counter with better spacing */}
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-6 py-3 rounded-full font-semibold text-base">
            {selectedCountries.length} of 3 selected
          </div>
        </div>

        {/* ======================================= */}
        {/* MAIN CONTENT CARD                       */}
        {/* ======================================= */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 border border-white/30 shadow-xl">
          {/* Search input with better spacing */}
          <div className="mb-10">
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xl p-6 rounded-2xl border-3 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300"
            />
          </div>

          {/* ======================================= */}
          {/* COUNTRY GRID - Fixed 2 rows x 8 cols   */}
          {/* No scrollbar, exactly 16 countries     */}
          {/* ======================================= */}
          <div className="mb-8">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredCountries.map((country) => (
                <button
                  key={country.name}
                  onClick={() => toggleCountry(country.name)}
                  disabled={
                    !selectedCountries.includes(country.name) &&
                    selectedCountries.length >= 3
                  }
                  className={`p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center min-h-[100px] ${
                    selectedCountries.includes(country.name)
                      ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md"
                  } ${
                    !selectedCountries.includes(country.name) &&
                    selectedCountries.length >= 3
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {/* Flag emoji */}
                  <div className="text-4xl mb-2">{country.flag}</div>

                  {/* Country name */}
                  <div className="font-medium text-xs text-center text-gray-800 leading-tight">
                    {country.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ======================================= */}
          {/* NAVIGATION BUTTONS                      */}
          {/* ======================================= */}
          <div className="flex justify-between items-center pt-8 border-t-2 border-gray-200">
            {/* Back button */}
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 hover:bg-gray-50 transition-all duration-300 text-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>

            {/* Next button */}
            <Button
              onClick={onNext}
              disabled={selectedCountries.length === 0}
              className="bg-[#002147] hover:bg-[#003366] text-white px-12 py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-lg"
            >
              Next Step →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
