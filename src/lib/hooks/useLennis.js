"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";

export function useLenis() {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = (window ).__lenis;
    if (instance) {
      setLenis(instance);
    }
  }, []);

  return lenis;
}