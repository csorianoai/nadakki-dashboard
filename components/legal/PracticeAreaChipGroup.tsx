"use client";

import { useState } from "react";
import { PracticeAreaChip } from "./PracticeAreaChip";

type Props = {
  tags: string[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
};

export function PracticeAreaChipGroup({ tags, maxVisible = 3, size = "sm" }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (tags.length === 0) return null;

  const visibleTags = expanded ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleTags.map((tag) => (
        <PracticeAreaChip key={tag} tag={tag} size={size} />
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-[var(--color-text-tertiary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          aria-label={`Mostrar ${hiddenCount} áreas más`}
        >
          +{hiddenCount} más
        </button>
      )}
    </div>
  );
}
