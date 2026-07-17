"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { VoiceMicButton } from "@/components/voice/VoiceMicButton";
import { buildSearchHref } from "@/lib/search-url";
import type { FilterState } from "@/lib/search-types";

export function SearchRefineBar({
  state,
  onChange,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const router = useRouter();

  const submit = () => {
    router.replace(buildSearchHref({ ...state, query: state.query.trim() }), { scroll: false });
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      <Input
        value={state.query}
        onChange={(e) => onChange({ ...state, query: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Refinar búsqueda..."
        className="min-h-11 flex-1"
        aria-label="Refinar búsqueda"
      />
      <VoiceMicButton />
    </div>
  );
}
