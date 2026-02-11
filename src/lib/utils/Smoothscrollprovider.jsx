"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }) {
  // Store lenis instance in a ref — must use React.useRef explicitly
  const lenisRef = useRef(null);

  useEffect(() => {
    // Prevent double-init in React StrictMode
    if (lenisRef.current) {
      lenisRef.current.destroy();
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
      autoResize: true,
    });

    // ✅ Assign to ref AFTER creation
    lenisRef.current = lenis;

    // Expose globally for other components
    if (typeof window !== "undefined") {
      window.__lenis = lenis;
    }

    // Animation frame loop
    let rafId;

    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;

      if (typeof window !== "undefined") {
        delete window.__lenis;
      }
    };
  }, []);

  return <>{children}</>;
}