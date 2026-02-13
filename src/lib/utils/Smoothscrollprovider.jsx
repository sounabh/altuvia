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
      // Global prevention logic for all scrollable elements
      prevent: (node) => {
        // Skip if explicitly marked
        if (node.hasAttribute('data-lenis-prevent') || 
            node.classList.contains('lenis-prevent')) {
          return true;
        }

        // Check if this element or any parent (up to body) is scrollable
        let current = node;
        while (current && current !== document.body) {
          const style = window.getComputedStyle(current);
          const overflow = style.overflow + style.overflowY + style.overflowX;
          
          // If element has scroll or auto overflow
          if (/(auto|scroll)/.test(overflow)) {
            // Check if it actually has scrollable content
            const hasVerticalScroll = current.scrollHeight > current.clientHeight;
            const hasHorizontalScroll = current.scrollWidth > current.clientWidth;
            
            if (hasVerticalScroll || hasHorizontalScroll) {
              return true; // Prevent Lenis from handling this
            }
          }
          
          current = current.parentElement;
        }
        
        return false;
      },
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