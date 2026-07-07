"use client";

import { NAUTA_TASK_INSTRUCTION_MAX_LENGTH } from "@/lib/nauta/freeformConfig";
import { S } from "@/lib/nauta/strings";

export function NautaTaskComposer({
  value,
  onChange,
  disabled,
  id = "nauta-task-instruction",
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const len = value.length;
  const atLimit = len >= NAUTA_TASK_INSTRUCTION_MAX_LENGTH;

  return (
    <div className="task-composer" data-testid="nauta-task-composer">
      <label className="task-composer-label" htmlFor={id}>
        {S.taskComposer.label}
      </label>
      <textarea
        id={id}
        className="task-composer-input"
        placeholder={S.taskComposer.placeholder}
        value={value}
        disabled={disabled}
        maxLength={NAUTA_TASK_INSTRUCTION_MAX_LENGTH}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        data-testid="nauta-task-instruction"
      />
      <div className={`task-composer-counter${atLimit ? " at-limit" : ""}`} aria-live="polite">
        {S.taskComposer.counter(len, NAUTA_TASK_INSTRUCTION_MAX_LENGTH)}
      </div>
    </div>
  );
}
