import { SmartCalendarPanel } from "@/components/realtor/smart-calendar/SmartCalendarPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/smart-calendar") };

export default function SmartCalendarPage() {
  return <SmartCalendarPanel />;
}
