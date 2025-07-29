import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// -----------------------------------------------------------------------------
// List of countries with their flags and map links
// -----------------------------------------------------------------------------
const countries = [
  {
    name: "United States",
    flag: "https://flagcdn.com/w160/us.png",
    code: "us",
    map: "https://example.com/maps/us",
  },
  {
    name: "United Kingdom",
    flag: "https://flagcdn.com/w160/gb.png",
    code: "gb",
    map: "https://example.com/maps/gb",
  },
  {
    name: "Canada",
    flag: "https://flagcdn.com/w160/ca.png",
    code: "ca",
    map: "https://example.com/maps/ca",
  },
  {
    name: "Australia",
    flag: "https://flagcdn.com/w160/au.png",
    code: "au",
    map: "https://example.com/maps/au",
  },
  {
    name: "Germany",
    flag: "https://flagcdn.com/w160/de.png",
    code: "de",
    map: "https://example.com/maps/de",
  },
  {
    name: "France",
    flag: "https://flagcdn.com/w160/fr.png",
    code: "fr",
    map: "https://example.com/maps/fr",
  },
  {
    name: "Netherlands",
    flag: "https://flagcdn.com/w160/nl.png",
    code: "nl",
    map: "https://example.com/maps/nl",
  },
  {
    name: "Switzerland",
    flag: "https://flagcdn.com/w160/ch.png",
    code: "ch",
    map: "https://example.com/maps/ch",
  },
  {
    name: "Sweden",
    flag: "https://flagcdn.com/w160/se.png",
    code: "se",
    map: "https://example.com/maps/se",
  },
  {
    name: "Denmark",
    flag: "https://flagcdn.com/w160/dk.png",
    code: "dk",
    map: "https://example.com/maps/dk",
  },
  {
    name: "Norway",
    flag: "https://flagcdn.com/w160/no.png",
    code: "no",
    map: "https://example.com/maps/no",
  },
  {
    name: "Finland",
    flag: "https://flagcdn.com/w160/fi.png",
    code: "fi",
    map: "https://example.com/maps/fi",
  },
  {
    name: "Japan",
    flag: "https://flagcdn.com/w160/jp.png",
    code: "jp",
    map: "https://example.com/maps/jp",
  },
  {
    name: "South Korea",
    flag: "https://flagcdn.com/w160/kr.png",
    code: "kr",
    map: "https://example.com/maps/kr",
  },
  {
    name: "Singapore",
    flag: "https://flagcdn.com/w160/sg.png",
    code: "sg",
    map: "https://example.com/maps/sg",
  },
  {
    name: "New Zealand",
    flag: "https://flagcdn.com/w160/nz.png",
    code: "nz",
    map: "https://example.com/maps/nz",
  },
];

// -----------------------------------------------------------------------------
// CountrySelectionStep Component
// - Handles country selection (max 3)
// - Displays flags and next/back buttons
// -----------------------------------------------------------------------------
export const CountrySelectionStep = ({
  selectedCountries = [],
  onNext = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  // Toggle a country in the selection list
  const toggleCountry = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      onUpdate(selectedCountries.filter((c) => c !== countryName));
    } else if (selectedCountries.length < 3) {
      onUpdate([...selectedCountries, countryName]);
    }
  };

  console.log('====================================');
  console.log(user.user.image);
  console.log('====================================');

  // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (user?.user.name) {
      const names = user?.user.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user?.user.email) {
      return user?.user.name[0].toUpperCase();
    }
    return 'U';
  };

  // API Base URL - this is how you should access it in Next.js
 

  return (
    <div className="min-h-screen w-fit max-w-none">
      <div className="relative z-100 flex flex-col justify-center items-center px-8 py-4 -my-20">
        {/* Header - logo and avatar */}
        <header className="bg-[#002147] w-[95%] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between">
          <div className="text-white text-xl font-semibold">Logo</div>
          
          {/* User Avatar with blue border */}
          <div className="relative">
            {user?.user.image ? (
              <img
                src={user?.user.image}
                alt={`${user?.user.name || 'User'} avatar`}
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
              className={`w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm ${user?.user.image ? 'hidden' : 'flex'}`}
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
            <span className="text-[#8a99aa]"> Welcome </span> {user?.user.name} ! We are
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
            Select Upto 3 countries where you'd like to study
          </p>
        </div>

        {/* Country flag selection grid */}
        <div className="mb-8 flex justify-center z-10">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8  gap-6 justify-items-center max-w-6xl">
            {countries.map((country) => {
              const isSelected = selectedCountries.includes(country.name);
              const isDisabled = !isSelected && selectedCountries.length >= 3;

              return (
                <div
                  key={country.name}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    onClick={() => !isDisabled && toggleCountry(country.name)}
                    className={`w-28 h-30 rounded-2xl transition-all duration-300 transform cursor-pointer overflow-hidden ${
                      isSelected
                        ? "border-4 border-[#002147] shadow-xl scale-110"
                        : "border-4 border-gray-300 hover:border-[#002147] hover:shadow-lg hover:scale-105"
                    } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    <picture className="w-full h-full block">
                      {/* WebP source (preferred) */}
                      <source
                        type="image/webp"
                        srcSet={`https://flagcdn.com/w80/${country.code}.webp, https://flagcdn.com/w160/${country.code}.webp 2x`}
                      />
                      {/* PNG fallback */}
                      <source
                        type="image/png"
                        srcSet={`https://flagcdn.com/w80/${country.code}.png, https://flagcdn.com/w160/${country.code}.png 2x`}
                      />
                      <img
                        src={`https://flagcdn.com/w80/${country.code}.png`}
                        alt={`${country.name} flag`}
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

        {/* Navigation buttons */}
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

// -----------------------------------------------------------------------------
// Demo Wrapper Component
// - Controls state and shows the step
// -----------------------------------------------------------------------------
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
