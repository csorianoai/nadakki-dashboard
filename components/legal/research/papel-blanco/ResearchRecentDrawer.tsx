"use client";

import { useEffect, useRef } from "react";

type StoredPreview = {
  label: string;
  messages: { role: string; content: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  previews: StoredPreview[];
  onRestore: (index: number) => void;
};

export function ResearchRecentDrawer({ open, onClose, previews, onRestore }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lr-drawer-backdrop" data-noprint role="presentation">
      <div ref={ref} className="lr-drawer" role="dialog" aria-label="Consultas recientes">
        <h3>Consultas recientes</h3>
        {previews.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--lr-chrome-item)" }}>No hay consultas guardadas.</p>
        ) : (
          previews.map((p, idx) => (
            <button key={idx} type="button" className="lr-drawer-item" onClick={() => onRestore(idx)}>
              {p.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
