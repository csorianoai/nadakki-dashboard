"use client";

import Link from "next/link";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseRelatedCasesPanel({ payload }: { payload: unknown }) {
  const m = useLegalCasesMessages();
  const list =
    payload && typeof payload === "object" && Array.isArray((payload as { cases?: unknown }).cases)
      ? ((payload as { cases: { case_id: string; title: string }[] }).cases ?? [])
      : [];
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-forgeGray-900">{m.related.title}</h2>
      {!list.length ? (
        <p className="text-sm text-forgeGray-500">Sin expedientes relacionados</p>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.case_id}>
              <Link href={`/legal/cases/${c.case_id}`} className="text-sm text-forgeBrand-700 hover:underline">
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
