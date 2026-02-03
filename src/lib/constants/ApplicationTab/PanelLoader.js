import React from "react";
import { Loader2 } from "lucide-react";

const PanelLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-white/50" />
    <span className="ml-3 text-sm text-white/60">Loading...</span>
  </div>
);

export default PanelLoader;