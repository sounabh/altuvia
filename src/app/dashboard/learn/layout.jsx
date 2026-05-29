// app/dashboard/learn/layout.jsx
// Server layout — renders LearnSidebar (client) + children
import { learnNav } from "@/lib/learnData";
import LearnSidebar from "./LearnSidebar";

export default function LearnLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-blue-50/60">
      <LearnSidebar items={learnNav} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}