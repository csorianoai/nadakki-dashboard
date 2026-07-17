"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatInput({
  value,
  onChange,
  onSend,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="flex shrink-0 items-end gap-2 border-t border-nk-border p-4">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={2}
        placeholder="Escribe tu mensaje…"
        className="min-h-[44px] flex-1 resize-none rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <Button
        type="button"
        variant="brand"
        size="icon"
        onClick={onSend}
        disabled={!value.trim()}
        aria-label="Enviar"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
