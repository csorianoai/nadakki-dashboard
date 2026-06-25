// Legacy redirect — entry point real: app/(forge)/legal/
import { redirect } from "next/navigation";

export default function LegalHubEntryPage() {
  redirect("/legal/cases");
}
