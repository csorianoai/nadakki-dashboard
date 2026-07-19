import type { AvailableAction, CaseState } from "@/lib/legal/cases/case-types";

function labelFromActionName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Live backend returns string[]; legacy spec used rich objects. */
export function normalizeAvailableActions(raw: unknown): AvailableAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") {
      const consumes = /generate|strateg|llm|draft|summar/i.test(item);
      return {
        action_name: item,
        display_name: labelFromActionName(item),
        description: "",
        estimated_time_seconds: 0,
        consumes_llm_tokens: consumes,
        requires_confirmation: /archive|close|purge|delete/i.test(item),
      };
    }
    const o = item as AvailableAction;
    return {
      action_name: o.action_name,
      display_name: o.display_name ?? labelFromActionName(o.action_name),
      description: o.description ?? "",
      estimated_time_seconds: o.estimated_time_seconds ?? 0,
      consumes_llm_tokens: Boolean(o.consumes_llm_tokens),
      requires_confirmation: Boolean(o.requires_confirmation),
    };
  });
}

export function normalizeStateTransitions(raw: unknown): CaseState[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is CaseState => typeof s === "string");
}
