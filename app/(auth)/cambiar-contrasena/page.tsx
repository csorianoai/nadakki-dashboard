"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tokenStorage } from "@/lib/auth/token-storage";

const MIN_PASSWORD_LENGTH = 12;

const MENSAJES_ERROR: Record<string, string> = {
  INVALID_CURRENT_PASSWORD: "La contraseña actual no es correcta.",
  PASSWORD_REUSED: "La contraseña nueva debe ser distinta de la actual.",
};

export default function CambiarContrasenaPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, mustChangePassword, changePassword } = useAuth();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Con tokens nuevos el init vuelve a correr; si la sesión carga, a la Suite.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !mustChangePassword) router.replace("/");
  }, [isLoading, isAuthenticated, mustChangePassword, router]);

  // Sin sesión ni cambio pendiente no hay nada que hacer aquí.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !mustChangePassword && !tokenStorage.getRefreshToken()) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, mustChangePassword, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (nueva.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña nueva debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (nueva !== confirmacion) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }
    setError(null);
    setEnviando(true);
    const r = await changePassword(actual, nueva);
    setEnviando(false);
    if (!r.ok) {
      setError((r.errorCode && MENSAJES_ERROR[r.errorCode]) || "No se pudo cambiar la contraseña. Intenta de nuevo.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-500">Verificando sesión...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3" aria-label="Cambiar contraseña">
        <h1 className="text-lg font-semibold">Cambia tu contraseña</h1>
        <p className="text-sm text-gray-500">
          Tu contraseña inicial debe cambiarse antes de continuar.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña actual
          <input type="password" autoComplete="current-password" required value={actual}
            onChange={(e) => setActual(e.target.value)} className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña nueva
          <input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH}
            value={nueva} onChange={(e) => setNueva(e.target.value)} className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirmar contraseña nueva
          <input type="password" autoComplete="new-password" required value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)} className="rounded border px-3 py-2" />
        </label>
        {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
        <button type="submit" disabled={enviando} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {enviando ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
