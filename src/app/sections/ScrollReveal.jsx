"use client";

import React, { useRef, ReactNode } from "react";
import { motion, useInView } from "framer-motion";



const directionOffsets = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.6,
  once = true,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once,
    margin: "-50px 0px",       // trigger slightly before element enters
    amount: 0.1,
  });

  const offset = directionOffsets[direction];

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: offset.x, y: offset.y }
      }
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for smooth feel
      }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}