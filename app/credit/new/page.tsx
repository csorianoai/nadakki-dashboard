// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
import { Suspense } from "react";
import NewApplicationClient from "./NewApplicationClient";

export default function NewApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
      }
    >
      <NewApplicationClient />
    </Suspense>
  );
}
