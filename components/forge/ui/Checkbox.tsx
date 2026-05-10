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
  { label, className, indeterminate, disabled, ...props },
  ref
) {
  const innerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 text-forge-sm",
        disabled ? "cursor-not-allowed text-forgeGray-400" : "cursor-pointer text-forgeGray-800 hover:text-forgeGray-900",
        className
      )}
    >
      <input
        ref={mergeRefs(ref, innerRef)}
        type="checkbox"
        disabled={disabled}
        className="h-4 w-4 rounded-forge-sm border-forgeGray-300 text-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 disabled:cursor-not-allowed disabled:border-forgeGray-200 disabled:bg-forgeGray-100 disabled:text-forgeGray-400"
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
});
