"use client";

import React, { Suspense, memo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CVDashboard from "./components/CVdashboard";
import CVBuilderEditor from "./components/CVbuilderEditor";

/**
 * LoadingSpinner - Reusable loading component
 * @param {string} message - Loading message to display
 */
const LoadingSpinner = memo(({ message = "Loading..." }) => (
  <div className="min-h-screen bg-cvLightBg flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#002147] mx-auto mb-2" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

/**
 * CVBuilderContent - Main content component that decides which view to show
 * Shows dashboard by default, editor when cvId OR edit/new parameter is present in URL
 */
const CVBuilderContent = () => {
  const searchParams = useSearchParams();
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    // Check if we should show the editor
    // Show editor if:
    // 1. cvId is present (editing existing CV from dashboard)
    // 2. 'edit' parameter is present (editing mode)
    // 3. 'new' parameter is present (creating new CV from dashboard)
    const cvId = searchParams.get("cvId");
    const editParam = searchParams.get("edit");
    const newParam = searchParams.get("new");
    
    // Determine if editor should be shown
    const shouldShowEditor = !!(cvId || editParam === "true" || newParam === "true");
    
    console.log("Route params check:", { 
      cvId, 
      editParam, 
      newParam, 
      shouldShowEditor 
    });
    
    setShowEditor(shouldShowEditor);
  }, [searchParams]);

  // Show editor if conditions are met, otherwise show dashboard
  if (showEditor) {
    return <CVBuilderEditor />;
  }

  return <CVDashboard />;
};

CVBuilderContent.displayName = "CVBuilderContent";

/**
 * Index - Main component wrapped with Suspense for loading states
 * Provides fallback UI while components are loading
 */
const Index = () => {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading CV Builder..." />}>
      <CVBuilderContent />
    </Suspense>
  );
};

Index.displayName = "Index";

export default Index;