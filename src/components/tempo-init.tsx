"use client";

import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    const initTempoDevtools = async () => {
      try {
        if (process.env.NEXT_PUBLIC_TEMPO && typeof window !== "undefined") {
          const { TempoDevtools } = await import("tempo-devtools");
          TempoDevtools.init();
        }
      } catch (error) {
        console.error("Failed to initialize Tempo Devtools:", error);
      }
    };

    initTempoDevtools();
  }, []);

  return null;
}
