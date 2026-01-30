import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// =============================================================================
// COUNTRY DATA CONSTANTS
// =============================================================================
const countries = [
  { name: "United States", flag: "https://flagcdn.com/w160/us.png", code: "us", map: "https://example.com/maps/us" },
  { name: "United Kingdom", flag: "https://flagcdn.com/w160/gb.png", code: "gb", map: "https://example.com/maps/gb" },
  { name: "Canada", flag: "https://flagcdn.com/w160/ca.png", code: "ca", map: "https://example.com/maps/ca" },
  { name: "Australia", flag: "https://flagcdn.com/w160/au.png", code: "au", map: "https://example.com/maps/au" },
  { name: "Germany", flag: "https://flagcdn.com/w160/de.png", code: "de", map: "https://example.com/maps/de" },
  { name: "France", flag: "https://flagcdn.com/w160/fr.png", code: "fr", map: "https://example.com/maps/fr" },
  { name: "Netherlands", flag: "https://flagcdn.com/w160/nl.png", code: "nl", map: "https://example.com/maps/nl" },
  { name: "Switzerland", flag: "https://flagcdn.com/w160/ch.png", code: "ch", map: "https://example.com/maps/ch" },
  { name: "Sweden", flag: "https://flagcdn.com/w160/se.png", code: "se", map: "https://example.com/maps/se" },
  { name: "Denmark", flag: "https://flagcdn.com/w160/dk.png", code: "dk", map: "https://example.com/maps/dk" },
  { name: "Norway", flag: "https://flagcdn.com/w160/no.png", code: "no", map: "https://example.com/maps/no" },
  { name: "Finland", flag: "https://flagcdn.com/w160/fi.png", code: "fi", map: "https://example.com/maps/fi" },
  { name: "Japan", flag: "https://flagcdn.com/w160/jp.png", code: "jp", map: "https://example.com/maps/jp" },
  { name: "South Korea", flag: "https://flagcdn.com/w160/kr.png", code: "kr", map: "https://example.com/maps/kr" },
  { name: "Singapore", flag: "https://flagcdn.com/w160/sg.png", code: "sg", map: "https://example.com/maps/sg" },
  { name: "New Zealand", flag: "https://flagcdn.com/w160/nz.png", code: "nz", map: "https://example.com/maps/nz" },
];

// =============================================================================
// CountrySelectionStep Component
// =============================================================================
export const CountrySelectionStep = ({
  selectedCountries = [],
  onNext = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  const toggleCountry = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      onUpdate(selectedCountries.filter((c) => c !== countryName));
    } else if (selectedCountries.length < 3) {
      onUpdate([...selectedCountries, countryName]);
    }
  };

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================
  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(" ");
      return names.length > 1
        ? (names[0][0] + names[1][0]).toUpperCase()
        : names[0][0].toUpperCase();
    }

    if (user?.email) {
      return user.email[0].toUpperCase();
    }

    return "U";
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
            {user?.image ? (
              <img
                src={user.image}
                alt={(user?.name || "User") + " avatar"}
                className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}

            {/* FALLBACK AVATAR: Shows user initials */}
            <div
              className={
                "w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm " +
                (user?.image ? "hidden" : "flex")
              }
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
            <span className="text-[#8a99aa]"> Welcome </span> {user?.name} ! We are
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
            Step {"0" + step}
          </div>
          <p className="text-sm text-black font-medium mb-5 z-10">
            Select Upto 3 countries where you'd like to study
          </p>
        </div>

        {/* COUNTRY SELECTION GRID */}
        <div className="mb-8 flex justify-center z-10">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center max-w-6xl">
            {countries.map((country) => {
              const isUSA = country.code === "us";
              const isSelected = selectedCountries.includes(country.name);
              const isDisabled = !isUSA || (!isSelected && selectedCountries.length >= 3);

              let cardClassName = "w-28 h-30 rounded-2xl transition-all duration-300 transform cursor-pointer overflow-hidden relative ";
              
              if (isSelected) {
                cardClassName += "border-[5px] border-[#002147] shadow-2xl scale-110 ring-4 ring-blue-300 ring-opacity-50 ";
              } else if (isUSA) {
                cardClassName += "border-[3px] border-gray-200 hover:border-blue-400 hover:shadow-lg hover:scale-105 ";
              } else {
                cardClassName += "border-[3px] border-gray-200 ";
              }
              
              if (!isUSA) {
                cardClassName += "opacity-60 cursor-not-allowed grayscale ";
              }
              
              if (isUSA && isDisabled) {
                cardClassName += "opacity-30 cursor-not-allowed ";
              }

              return (
                <div
                  key={country.name}
                  className="flex flex-col items-center gap-2"
                >
                  {/* COUNTRY FLAG CARD */}
                  <div
                    onClick={() => {
                      if (isUSA && !isDisabled) {
                        toggleCountry(country.name);
                      }
                    }}
                    className={cardClassName}
                  >
                    {/* Coming Soon Tag for non-USA countries */}
                    {!isUSA && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md transform -rotate-12 shadow-lg">
                          Coming Soon
                        </span>
                      </div>
                    )}

                    {/* Selection Checkmark Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#002147] text-white rounded-full w-6 h-6 flex items-center justify-center z-10 shadow-md">
                        <span className="text-xs font-bold">✓</span>
                      </div>
                    )}

                    {/* RESPONSIVE IMAGE HANDLING: WebP preferred with PNG fallback */}
                    <picture
                      className={
                        "w-full h-full block transition-all duration-300 " +
                        (isSelected ? "brightness-100" : "brightness-95")
                      }
                    >
                      {/* WebP source (preferred format) */}
                      <source
                        type="image/webp"
                        srcSet={
                          "https://flagcdn.com/w80/" + country.code + ".webp, https://flagcdn.com/w160/" + country.code + ".webp 2x"
                        }
                      />
                      {/* PNG fallback for unsupported browsers */}
                      <source
                        type="image/png"
                        srcSet={
                          "https://flagcdn.com/w80/" + country.code + ".png, https://flagcdn.com/w160/" + country.code + ".png 2x"
                        }
                      />
                      <img
                        src={"https://flagcdn.com/w80/" + country.code + ".png"}
                        alt={country.name + " flag"}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center max-w-24 leading-tight">
                    {country.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* NAVIGATION BUTTON: Next only */}
        <div className="flex justify-end items-center absolute top-[53rem] -left-[15rem] w-full mt-8 pb-20">
          <Button
            onClick={onNext}
            disabled={selectedCountries.length === 0}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg"
          >
            Next
            <span className="">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Demo Wrapper Component
// =============================================================================
export default function CountrySelectionDemo() {
  const [selectedCountries, setSelectedCountries] = useState([]);
  
  return (
    <CountrySelectionStep
      selectedCountries={selectedCountries}
      onUpdate={setSelectedCountries}
      onNext={() => console.log("Next clicked with:", selectedCountries)}
      onBack={() => console.log("Back clicked")}
    />
  );
}