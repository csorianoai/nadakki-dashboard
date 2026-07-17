/** Navigate to search results from voice transcription. */

import { parseNaturalQuery } from "@/lib/search-parser";
import { buildSearchHref } from "@/lib/search-url";
import { DEFAULT_FILTER_STATE } from "@/lib/search-types";

export function buildVoiceSearchHref(transcription: string): string {
  const trimmed = transcription.trim();
  const parsed = parseNaturalQuery(trimmed);
  return buildSearchHref({
    ...DEFAULT_FILTER_STATE,
    ...parsed,
    query: parsed.query ?? trimmed,
  });
}
