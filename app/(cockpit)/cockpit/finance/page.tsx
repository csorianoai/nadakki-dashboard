import { redirect } from "next/navigation";

export default function FinanceIndexPage() {
  redirect("/cockpit/finance/revenue");
}
