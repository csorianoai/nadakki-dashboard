interface ConsentBrandingHeaderProps {
  institutionName: string;
  branding: { logo_url?: string | null; primary_color?: string | null };
}

export function ConsentBrandingHeader({ institutionName, branding }: ConsentBrandingHeaderProps) {
  const primary = branding.primary_color?.trim() || "#2563eb";

  return (
    <header className="flex min-w-0 items-center gap-4 border-b border-slate-800 pb-4">
      {branding.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa del tenant; dominio no garantizado en next/image
        <img
          src={branding.logo_url}
          alt=""
          aria-hidden
          className="h-12 w-auto max-w-[40%] object-contain"
          width={160}
          height={48}
        />
      ) : (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-bold text-white"
          style={{ backgroundColor: primary }}
          aria-hidden
        >
          {institutionName.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold leading-tight text-white">{institutionName}</p>
      </div>
    </header>
  );
}
