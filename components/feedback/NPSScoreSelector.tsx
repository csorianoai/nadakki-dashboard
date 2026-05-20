"use client";

const SCORE_SET = Array.from({ length: 11 }, (_, i) => i);

function scoreTone(score: number): string {
  if (score <= 6) {
    return "border-red-700/55 bg-red-950/85 text-red-50 hover:bg-red-800/95 focus-visible:outline-red-300";
  }
  if (score <= 8) {
    return "border-amber-400/65 bg-amber-950/80 text-amber-50 hover:bg-amber-800/95 focus-visible:outline-amber-200";
  }
  return "border-emerald-500/55 bg-emerald-950/75 text-emerald-50 hover:bg-emerald-800/95 focus-visible:outline-emerald-200";
}

interface NPSScoreSelectorProps {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}

export function NPSScoreSelector({ value, onChange, disabled }: NPSScoreSelectorProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Puntuación NPS entre 0 y 10"
      data-testid="nps-score-selector"
    >
      {SCORE_SET.map((score) => {
        const pressed = value === score;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={pressed}
            aria-label={`Puntuación ${score} de 10`}
            disabled={disabled}
            data-testid={`nps-score-${score}`}
            className={[
              "min-h-[44px] min-w-[44px] rounded-lg border px-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 max-sm:flex-1 sm:min-w-[40px]",
              scoreTone(score),
              pressed ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950" : "",
              disabled ? "cursor-not-allowed opacity-35" : "",
            ].join(" ")}
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
