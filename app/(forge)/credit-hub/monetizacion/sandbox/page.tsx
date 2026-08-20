import { notFound } from "next/navigation";
import { MonetizacionSandboxClient } from "./MonetizacionSandboxClient";

export default function MonetizacionSandboxPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MonetizacionSandboxClient />;
}
