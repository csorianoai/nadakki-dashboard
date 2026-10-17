"use client";

import { useState } from "react";
import type { Rol } from "./api";

export function FormAlta({ roles, onAlta }: { roles: Rol[]; onAlta: (email: string, rol: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const listo = email.trim().length > 0 && rol.length > 0;

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!listo) return;
        await onAlta(email.trim(), rol);
        setEmail("");
      }}
    >
      <label className="text-sm">
        Correo
        <input
          data-testid="alta-correo"
          type="email"
          className="ml-2 rounded bg-black/30 px-2 py-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="text-sm">
        Rol
        <select data-testid="alta-rol" className="ml-2 rounded bg-black/30 px-2 py-1" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="">Elegir…</option>
          {roles.map((r) => (
            <option key={r.role_key} value={r.role_key}>{r.display_name}</option>
          ))}
        </select>
      </label>
      <button data-testid="alta-enviar" type="submit" disabled={!listo} className="rounded bg-violet-600 px-3 py-1 text-sm disabled:opacity-50">
        Dar de alta
      </button>
    </form>
  );
}
