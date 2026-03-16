"use client";

import { ThemeProvider } from "@/lib/theme";
import type { ReactNode } from "react";

// FEATURE_INJECT: providers_imports

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* FEATURE_INJECT: providers_wrap_start */}
      {children}
      {/* FEATURE_INJECT: providers_wrap_end */}
    </ThemeProvider>
  );
}
