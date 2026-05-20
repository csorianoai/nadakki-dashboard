"use client";

import { Star } from "lucide-react";

interface RatingStarsProps {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  label?: string;
}

export function RatingStars({
  value,
  onChange,
  disabled,
  label = "Calificación de 1 a 5 estrellas",
}: RatingStarsProps) {
  const starIds = ["uno", "dos", "tres", "cuatro", "cinco"] as const;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="radiogroup"
      aria-label={label}
      data-testid="rating-stars"
    >
      {starIds.map((sid, idx) => {
        const score = idx + 1;
        const active = value >= score;
        return (
          <button
            key={sid}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} de 5 estrellas`}
            disabled={disabled}
            data-testid={`rating-star-${score}`}
            className={[
              "rounded-md p-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400",
              disabled ? "cursor-not-allowed opacity-40" : "hover:scale-105",
            ].join(" ")}
            onClick={() => onChange(score)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange(Math.min(5, score === value ? score + 1 : score));
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange(Math.max(1, score === value ? score - 1 : score));
              }
            }}
          >
            <Star
              aria-hidden="true"
              className={[active ? "text-amber-300" : "text-slate-500", "h-8 w-8"].join(" ")}
              strokeWidth={1.5}
              fill={active ? "currentColor" : "transparent"}
            />
          </button>
        );
      })}
      <span className="sr-only" aria-live="polite">{`Seleccionado ${value} de 5`}</span>
    </div>
  );
}
