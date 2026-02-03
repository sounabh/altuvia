import React from "react";
import { Lock, CheckCircle2 } from "lucide-react";

const LockedTabContent = ({
  tabName,
  universityName,
  onAddUniversity,
  isAddingUniversity,
}) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-white/10">
          <Lock className="w-16 h-16 text-white/60" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">{tabName} Locked</h3>

      <p className="text-white/70 mb-6 leading-relaxed">
        Add <span className="font-semibold text-white">{universityName}</span>{" "}
        to your dashboard to unlock {tabName.toLowerCase()} management and start
        working on your application.
      </p>

      <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-semibold text-white/80 mb-3">
          Unlock access to:
        </p>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-400" />
            {tabName === "Essays"
              ? "Essay prompts and writing workspace"
              : "Deadline tracking and calendar"}
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-400" />
            {tabName === "Essays"
              ? "AI-powered suggestions and analytics"
              : "Event reminders and notifications"}
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-400" />
            {tabName === "Essays"
              ? "Version history and auto-save"
              : "Task completion tracking"}
          </li>
        </ul>
      </div>

      <p className="text-xs text-white/50 mt-4">
        This will save the university to your application dashboard
      </p>
    </div>
  </div>
);

export default LockedTabContent;