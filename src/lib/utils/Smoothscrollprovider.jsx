"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.destroy();
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
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

    lenisRef.current = lenis;

    if (typeof window !== "undefined") {
      window.__lenis = lenis;
    }

    function raf(time) {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    }

    rafIdRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      lenis.destroy();
      lenisRef.current = null;
      if (typeof window !== "undefined") {
        delete window.__lenis;
      }
    };
  }, []);

  return <>{children}</>;
}