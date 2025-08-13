import React, { useState, useEffect } from "react";
import { ArrowLeft, Bell, Settings, Heart, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";

const Header = ({ university }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousState, setPreviousState] = useState(null);

  const router = useRouter();

  /**
   * Effect to initialize saved status by checking if current user has saved this university
   */
  useEffect(() => {
    try {
      const authData = localStorage.getItem("authData");
      if (!authData || !university) return;

      const parsedData = JSON.parse(authData);
      const userId = parsedData.userId;

      // Check if user's id is inside savedByUsers array of objects
      const isSaved =
        Array.isArray(university.savedByUsers) &&
        university.savedByUsers.some((user) => user.id === userId);

      setIsAdded(isSaved);
    } catch (error) {
      console.error("Error initializing saved status:", error);
    }
  }, [university]);

  /**
   * Toggle university saved status with optimistic updates
   */

  console.log(university, "header");

  const toggleSaved = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Get fresh auth data from localStorage
    const authData =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;

    if (!authData) {
      console.warn("⚠️ No auth data found in localStorage");
      return;
    }

    const parsedData = JSON.parse(authData);

    // Store current state for potential rollback
    setPreviousState(isAdded);

    // Optimistic update - change UI immediately
    setIsAdded(!isAdded);
    setIsLoading(true);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(
        `${API_BASE_URL}/api/university/toggleSaved`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedData.token}`,
          },
          body: JSON.stringify({ universityId: university?.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Confirm the optimistic update was correct
        setIsAdded(data.isAdded);
      } else {
        // Rollback on error
        console.error("Failed to update status:", response.status);
        setIsAdded(previousState);
      }
    } catch (error) {
      // Rollback on error
      console.error("Error toggling save:", error);
      setIsAdded(previousState);
    } finally {
      setIsLoading(false);
      setPreviousState(null);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section: Back Button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-[#002147]"
             onClick={() => router.push(`/dashboard`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>

          {/* Center Section: School Title & Save Status */}
          <div className="text-center flex-1 mx-4">
            <div className="flex items-center justify-center space-x-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#002147] truncate">
                  {university?.name || "University Profile"}
                </h1>
                {university?.location && (
                  <p className="text-sm text-gray-600 hidden md:block">
                    {university.location}
                  </p>
                )}
              </div>

              {/* Save Status Button */}
              {university && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSaved}
                  disabled={isLoading}
                  className={`relative transition-all duration-300 ${
                    isAdded
                      ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                      : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  } ${isLoading ? "opacity-75" : ""}`}
                  title={
                    isAdded
                      ? "Remove from saved universities"
                      : "Save this university"
                  }
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isAdded ? (
                    <Heart className="h-5 w-5 fill-current" />
                  ) : (
                    <Heart className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>

            {/* Save Status Indicator */}
            {university && (
              <div className="mt-1 hidden sm:block">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    isAdded
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                      {isAdded ? "Saving..." : "removing..."}
                    </>
                  ) : isAdded ? (
                    <>
                      <Heart className="w-3 h-3 mr-1 fill-current" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Heart className="w-3 h-3 mr-1" />
                      Not Saved
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Right Section: Progress + Notification + Settings */}
          <div className="flex items-center space-x-2">
            {/* Progress Info */}
            <div className="text-right mr-4 hidden lg:block">
              <span className="text-sm text-gray-600">65% Complete</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                <div className="w-16 h-2 bg-[#3598FE] rounded-full transition-all duration-300"></div>
              </div>
            </div>

            {/* Notification Icon */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* Settings Icon */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Progress Bar & Save Status */}
        <div className="mt-3 md:hidden">
          {/* Mobile Save Status */}
          {university && (
            <div className="flex items-center justify-center mb-3 sm:hidden">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isAdded
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                    {isAdded ? "Removing..." : "Saving..."}
                  </>
                ) : isAdded ? (
                  <>
                    <Heart className="w-4 h-4 mr-2 fill-current" />
                    Saved to My Universities
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Tap heart to save
                  </>
                )}
              </span>
            </div>
          )}

          {/* Mobile Progress */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Application Progress</span>
            <span>65% Complete</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="w-2/3 h-2 bg-[#3598FE] rounded-full transition-all duration-300"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
