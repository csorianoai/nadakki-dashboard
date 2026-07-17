export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="inline-flex gap-1 rounded-[15px_15px_15px_4px] border border-nk-border bg-nk-surface px-4 py-3">
        {[0, 0.15, 0.3].map((delay, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-nk-fg-muted animate-nkDot"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
  );
}
