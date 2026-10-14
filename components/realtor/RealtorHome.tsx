"use client";

import Link from "next/link";
import { HOME_INTRO } from "@/lib/realtor/copy";
import { RealtorNotice } from "./RealtorNotice";
import { useRealtorAccess } from "./useRealtorAccess";

const MODULES = [
  { href: "/realtor/demand-radar", title: "Demand Radar AI", text: "Señales de demanda agregadas por zona." },
];

export function RealtorHome() {
  const access = useRealtorAccess();
  if (access !== "ok") return <RealtorNotice reason={access} />;
  return (
    <section data-testid="realtor-home" className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Real Estate</h1>
      <p className="text-sm">{HOME_INTRO}</p>
      <ul className="grid gap-4 md:grid-cols-2">
        {MODULES.map((m) => (
          <li key={m.href} className="rounded border p-4">
            <Link href={m.href} className="font-semibold underline">{m.title}</Link>
            <p className="text-sm">{m.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
