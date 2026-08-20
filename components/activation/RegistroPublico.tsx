"use client";

import { useState } from "react";
import { toast } from "@/components/forge";

interface RegistroForm {
  nombre_legal: string;
  rnc: string;
  email_admin: string;
  telefono: string;
  tipo_institucion: "BANCO" | "CONCESIONARIO";
}

function validateRNC(rnc: string): boolean {
  // RNC dominicano: 9 o 11 dígitos
  const cleaned = rnc.replace(/[-\s]/g, "");
  return /^\d{9}$|^\d{11}$/.test(cleaned);
}

function normalizeRNC(rnc: string): string {
  return rnc.replace(/[-\s]/g, "");
}

export function RegistroPublico() {
  const [form, setForm] = useState<RegistroForm>({
    nombre_legal: "",
    rnc: "",
    email_admin: "",
    telefono: "",
    tipo_institucion: "BANCO",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación en línea
    if (!form.nombre_legal.trim()) {
      toast.error("El nombre legal es requerido");
      return;
    }

    if (!validateRNC(form.rnc)) {
      toast.error("RNC inválido. Debe tener 9 u 11 dígitos");
      return;
    }

    if (!form.email_admin.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    if (!form.telefono.trim()) {
      toast.error("El teléfono es requerido");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/onboarding/registro`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre_legal: form.nombre_legal.trim(),
            rnc: normalizeRNC(form.rnc),
            email_admin: form.email_admin.trim().toLowerCase(),
            telefono: form.telefono.trim(),
            tipo_institucion: form.tipo_institucion,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(error.detail || "Error al registrar");
      }

      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Solicitud recibida</h2>
          <p className="text-slate-300">
            Revisamos tu solicitud en <strong>24 a 48 horas</strong> y te escribimos a{" "}
            <strong>{form.email_admin}</strong>
          </p>
          <p className="text-sm text-slate-400">
            Verifica tu bandeja de entrada y carpeta de spam. Si no recibes noticias en 48 horas, contáctanos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Únete a Nadakki</h1>
        <p className="text-slate-300">Cuatro campos, 2 minutos. Así de simple.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nombre_legal" className="block text-sm font-medium mb-2">
            Nombre legal de la institución
          </label>
          <input
            id="nombre_legal"
            type="text"
            value={form.nombre_legal}
            onChange={(e) => setForm({ ...form, nombre_legal: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Banco Nacional S.A."
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="rnc" className="block text-sm font-medium mb-2">
            RNC
          </label>
          <input
            id="rnc"
            type="text"
            value={form.rnc}
            onChange={(e) => setForm({ ...form, rnc: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123456789 o 12345678901"
            required
            disabled={submitting}
          />
          <p className="text-xs text-slate-400 mt-1">9 u 11 dígitos</p>
        </div>

        <div>
          <label htmlFor="email_admin" className="block text-sm font-medium mb-2">
            Correo del administrador
          </label>
          <input
            id="email_admin"
            type="email"
            value={form.email_admin}
            onChange={(e) => setForm({ ...form, email_admin: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="admin@tuinstitucion.com"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium mb-2">
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 809 555 1234"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tipo de institución</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="tipo_institucion"
                value="BANCO"
                checked={form.tipo_institucion === "BANCO"}
                onChange={(e) => setForm({ ...form, tipo_institucion: e.target.value as "BANCO" })}
                className="mr-2"
                disabled={submitting}
              />
              Banco
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tipo_institucion"
                value="CONCESIONARIO"
                checked={form.tipo_institucion === "CONCESIONARIO"}
                onChange={(e) => setForm({ ...form, tipo_institucion: e.target.value as "CONCESIONARIO" })}
                className="mr-2"
                disabled={submitting}
              />
              Concesionario
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {submitting ? "Enviando..." : "Solicitar acceso"}
        </button>

        <p className="text-xs text-slate-400 text-center">
          Al registrarte, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </form>
    </div>
  );
}
