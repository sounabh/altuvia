// app/dashboard/learn/application-playbooks/page.jsx
import { Clipboard } from "lucide-react";
import { playbooks } from "@/lib/learnData";

const badgeStyles = {
  FLAGSHIP:   "bg-[#3598FE]/10 text-[#3598FE]",
  SPECIALIZED:"bg-gray-100 text-gray-600",
  REGIONAL:   "bg-orange-100 text-orange-700",
  TOOL:       "bg-teal-100 text-teal-700",
};

export default function ApplicationPlaybooksPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#002147]/10 rounded-xl">
          <Clipboard className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002147] font-roboto tracking-[0.4px]">
            Application Playbooks
          </h1>
          <p className="text-sm text-gray-500 font-roboto">
            Step-by-step checklists. Sync milestones to your Calendar as you go.
          </p>
        </div>
      </div>

      <div className="h-6" />

      <div className="grid grid-cols-2 gap-4">
        {playbooks.map((pb) => (
          <div
            key={pb.id}
            className="
              rounded-2xl border border-gray-200/70 bg-white p-6
              flex flex-col gap-4 shadow-sm
              hover:shadow-md hover:border-[#3598FE]/30
              transition-all duration-300
            "
          >
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full w-fit tracking-wide font-roboto ${badgeStyles[pb.badge]}`}>
              {pb.badge}
            </span>
            <div className="flex-1">
              <h2 className="font-semibold text-[#002147] text-base mb-1 font-roboto tracking-[0.3px]">
                {pb.title}
              </h2>
              <p className="text-sm text-gray-500 font-roboto">{pb.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-roboto">
                {pb.steps} steps · {pb.months} months
              </p>
              <button className="
                text-sm font-medium border border-gray-200 px-4 py-1.5
                rounded-xl font-roboto text-[#002147]
                hover:bg-[#F0F4FA] hover:border-[#3598FE]/40
                transition-all duration-200
              ">
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}