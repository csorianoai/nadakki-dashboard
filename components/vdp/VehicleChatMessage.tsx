"use client";

import { cn } from "@/lib/utils";

export function VehicleChatMessage({
  role,
  text,
  children,
}: {
  role: "user" | "bot" | "system";
  text: string;
  children?: React.ReactNode;
}) {
  if (role === "system") {
    return (
      <div className="flex justify-center">
        <p className="max-w-[90%] rounded-full bg-nk-surface-2 px-3 py-1.5 text-center text-xs text-nk-fg-muted">
          {text}
        </p>
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-[15px_15px_4px_15px] bg-gradient-to-r from-brand-2 to-brand text-white"
            : "rounded-[15px_15px_15px_4px] border border-brand-2/20 bg-brand-2/5 text-nk-fg",
        )}
      >
        <p>{text}</p>
        {children}
      </div>
    </div>
  );
}
