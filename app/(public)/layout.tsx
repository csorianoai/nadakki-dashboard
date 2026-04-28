import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nadakki — Autorización",
  description: "Plataforma de autorización segura",
  robots: "noindex, nofollow",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-white antialiased">{children}</div>;
}
