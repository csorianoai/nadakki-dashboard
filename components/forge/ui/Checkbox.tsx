"use client";

import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Visible label; omit when using `aria-label` on the control only. */
  label?: string;
  indeterminate?: boolean;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | null | undefined>) {
  return (node: T | null) => {
    refs.forEach((r) => {
      if (typeof r === "function") r(node);
      else if (r && typeof r === "object" && "current" in r) {
        (r as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, indeterminate, ...props },
  ref
) {
  const innerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-forge-sm text-forgeInk-800", className)}>
      <input
        ref={mergeRefs(ref, innerRef)}
        type="checkbox"
        className="h-4 w-4 rounded-forge-sm border-forgeInk-300 text-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
});
