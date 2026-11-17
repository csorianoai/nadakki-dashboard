import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

/** La página es de cliente («use client» no admite metadata): el título va en su layout. */
export const metadata: Metadata = { title: tituloRealtor("/realtor/alta") };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
