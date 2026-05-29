// ─── Nav.tsx ─────────────────────────────────────────────────────
"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

const Nav = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  return (
    <nav className="pt-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold tracking-[-0.1px] leading-[28.8px] text-[22px] text-[#002147] flex items-center">
          <motion.span
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            A
          </motion.span>
          <span>pply</span>
          <motion.span
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-[#3598FE]"
          >
            Mate
          </motion.span>
        </div>

        <Link href={isLoggedIn ? "/dashboard" : "/onboarding/signup"}>
          <button className="px-3 py-3 md:px-6 md:py-2 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-medium text-balance text-[15px] flex items-center justify-center transform hover:rounded-3xl">
            {isLoggedIn ? "Dashboard" : "Sign Up"}
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default Nav;