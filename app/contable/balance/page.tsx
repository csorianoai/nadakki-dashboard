import { redirect } from "next/navigation";

/** /contable/balance no tiene pantalla propia: el balance es el de comprobacion. */
export default function ContableBalancePage() {
  redirect("/contable/balance-comprobacion");
}
