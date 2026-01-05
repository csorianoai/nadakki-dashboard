"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
