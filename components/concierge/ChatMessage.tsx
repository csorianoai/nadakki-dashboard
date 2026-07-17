"use client";

import { cn } from "@/lib/utils";

export function ChatMessage({
  role,
  text,
  children,
}: {
  role: "user" | "bot";
  text: string;
  children?: React.ReactNode;
}) {
  const isUser = role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-[15px_15px_4px_15px] bg-gradient-to-r from-brand to-brand-2 text-white"
            : "rounded-[15px_15px_15px_4px] border border-nk-border bg-nk-surface text-nk-fg",
        )}
      >
        <p>{text}</p>
        {children}
      </div>
    </div>
  );
}
