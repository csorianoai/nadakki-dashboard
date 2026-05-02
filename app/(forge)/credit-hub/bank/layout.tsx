"use client";

import { type ReactNode } from "react";

export default function BankLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
      {children}
    </div>
  );
}
