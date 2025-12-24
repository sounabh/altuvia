import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Building2, GraduationCap, FileText } from "lucide-react";

export const LoadingAndErrorStates = ({ type, error, router }) => {
  if (type === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3598FE]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002147]">
                Loading Workspace
              </h3>
              <p className="text-sm text-[#6C7280]">
                Fetching essays from saved universities...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error Loading Workspace
          </h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg active:scale-95"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (type === "no-universities") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#002147] mb-2">
            No Saved Universities
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Save universities to start working on their essays
          </p>
          <Button
            onClick={() => router.push("/dashboard/search")}
            className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg active:scale-95"
          >
            Browse Universities
          </Button>
        </Card>
      </div>
    );
  }

  return null;
};