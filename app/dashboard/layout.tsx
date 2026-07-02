import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "AI Agents Dashboard",
  description: 'Dashboard centralizado de agentes organizados por Core',
};
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
