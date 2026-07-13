/** Registry mutation bus — population tabs refresh after CRUD. */
export const REGISTRY_MUTATED_EVENT = "cockpit:registry-mutated";

export function emitRegistryMutated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REGISTRY_MUTATED_EVENT));
  }
}

export function onRegistryMutated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(REGISTRY_MUTATED_EVENT, handler);
  return () => window.removeEventListener(REGISTRY_MUTATED_EVENT, handler);
}
