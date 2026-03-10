"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

const Nav = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const { theme, toggleTheme } = useTheme();

  //console.log("🔐 Session Data:", session);
  //console.log("Status:", status);

  return (
    <nav className="pt-4">
      <div className="flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="font-semibold tracking-[-0.1px] leading-[28.8px] text-[22px] text-[#002147] dark:text-white flex items-center">
          <motion.span
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            A
          </motion.span>
          <span>ltu</span>
          <motion.span
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-[#3598FE]"
          >
            via
          </motion.span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-blue-100 bg-white/80 dark:bg-slate-900 dark:border-slate-700 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#002147]" />
            )}
          </button>

          {/* Conditional button isLoggedIn && session?.hasCompleteProfile */}
          <Link href={isLoggedIn ? "/dashboard" : "/onboarding/signup"}>
            <button className="px-3 py-3 md:px-6 md:py-2 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-medium text-balance text-[15px] flex items-center justify-center transform hover:rounded-3xl">
              {isLoggedIn ? "Dashboard" : "Sign Up"}
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
