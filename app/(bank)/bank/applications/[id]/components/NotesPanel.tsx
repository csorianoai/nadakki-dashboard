"use client";

export interface NotesPanelProps {
  notes: string | null | undefined;
}

export function NotesPanel({ notes }: NotesPanelProps) {
  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="notes-section-title"
    >
      <h2 id="notes-section-title" className="text-lg font-semibold text-forgeGray-900">
        Notas internas
      </h2>
      {notes?.trim() ? (
        <p className="mt-4 whitespace-pre-wrap text-forge-sm text-forgeGray-800">{notes}</p>
      ) : (
        <p className="mt-4 text-forge-sm text-forgeGray-600">Sin notas registradas.</p>
      )}
    </section>
  );
}
