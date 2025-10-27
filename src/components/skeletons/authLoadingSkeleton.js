import { Separator } from "@/components/ui/separator";

/**
 * Loading Skeleton Component for authentication modal
 * Provides a shimmering loading state while authentication data is being initialized
 * @returns {JSX.Element} Loading skeleton UI
 */
export const AuthLoadingSkeleton = () => (
  <div className="space-y-5 py-2 animate-pulse">
    {/* Social Buttons Skeleton */}
    <div className="space-y-3">
      <div className="w-full h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"></div>
      <div className="w-full h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"></div>
    </div>

    {/* Divider */}
    <div className="relative">
      <Separator className="bg-gray-200" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="bg-white px-3 text-sm text-gray-400">or</span>
      </div>
    </div>

    {/* Form Fields Skeleton */}
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-11 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg"></div>
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-11 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg"></div>
      </div>

      <div className="h-11 bg-gradient-to-r from-[#002147] via-[#003366] to-[#002147] rounded-lg"></div>
    </div>

    {/* Toggle Text Skeleton */}
    <div className="flex justify-center gap-2">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
      <div className="h-4 bg-gray-300 rounded w-16"></div>
    </div>
  </div>
);