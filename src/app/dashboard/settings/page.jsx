// ==========================================
// FILE: app/(dashboard)/settings/page.jsx
// DESCRIPTION: Settings page component
// ==========================================

import SettingsPage from "@/app/sections/Settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings | Altuvia",
  description: "Manage your account settings and preferences"
};

export default async function Settings() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/onboarding/signup");
  }

  // Redirect to onboarding if profile incomplete
  if (!session.hasCompleteProfile) {
    redirect("/onboarding/signup");
  }

  return <SettingsPage />;
}