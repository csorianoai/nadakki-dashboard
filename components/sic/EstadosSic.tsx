"use client";

interface EstadoBaseProps {
  titulo?: string;
  mensaje?: string;
  children?: React.ReactNode;
}

export function LoadingSic({ titulo = "Cargando", mensaje }: EstadoBaseProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-8 h-8 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin mb-4" />
      <p className="text-slate-300 text-sm font-medium">{titulo}</p>
      {mensaje && <p className="text-slate-500 text-xs mt-1">{mensaje}</p>}
    </div>
  );
}

export function EmptySic({ titulo = "Sin datos", mensaje, children }: EstadoBaseProps) {
  return (
    <div className="py-12 px-4 text-center border border-slate-700/50 rounded-lg bg-slate-900/30">
      <p className="text-slate-400 text-sm font-medium">{titulo}</p>
      {mensaje && <p className="text-slate-500 text-xs mt-1">{mensaje}</p>}
      {children}
    </div>
  );
}

export function ErrorSic({ titulo = "Error", mensaje, children }: EstadoBaseProps) {
  return (
    <div className="py-6 px-4 border border-red-500/40 rounded-lg bg-red-500/10">
      <p className="text-red-300 text-sm font-medium">{titulo}</p>
      {mensaje && <p className="text-red-400/90 text-xs mt-1">{mensaje}</p>}
      {children}
    </div>
  );
}

export function SuccessSic({ titulo = "Operación completada", mensaje }: EstadoBaseProps) {
  return (
    <div className="py-3 px-4 border border-emerald-500/40 rounded-lg bg-emerald-500/10 flex items-center gap-3">
      <span className="text-emerald-400 text-lg">✓</span>
      <div>
        <p className="text-emerald-300 text-sm font-medium">{titulo}</p>
        {mensaje && <p className="text-emerald-400/90 text-xs mt-0.5">{mensaje}</p>}
      </div>
    </div>
  );
}
