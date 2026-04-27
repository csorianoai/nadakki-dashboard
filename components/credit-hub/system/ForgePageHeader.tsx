import { type ReactNode } from "react";

interface ForgePageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function ForgePageHeader({ title, subtitle, action }: ForgePageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-forge-text md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-forge-text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
