import React from "react";
import { X } from "lucide-react";

const Panel = ({
  name,
  title,
  icon: Icon,
  iconColor,
  children,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="mb-4 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 bg-gradient-to-br ${iconColor} rounded-lg`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Panel;