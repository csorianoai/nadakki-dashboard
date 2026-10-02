"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, FilePenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Select } from "@/components/forge";
import {
  ContableApiError,
  createAsiento,
  listCuentas,
  listPeriodos,
  postAsiento,
} from "@/app/hooks/contable";
import { BalanceIndicator } from "@/components/contable/BalanceIndicator";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import { currencyParaEnviar, errorDeMoneda, esIso4217 } from "@/lib/contable/moneda-asiento";
import {
  sumAsientoSides,
  type AsientoLineaInput,
  type CreateAsientoPayload,
  type CuentaContable,
  type PeriodoContable,
} from "@/types/contable";

function emptyLine(): AsientoLineaInput {
  return { cuenta_id: "", descripcion: "", debe_original: 0, haber_original: 0 };
}

export function CrearAsientoClient() {
  const tenantId = useContableTenantId();
  const router = useRouter();
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [header, setHeader] = useState({
    periodo_id: "",
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: "",
    /** Vacio = la del tenant. El backend resuelve la funcional si no se envia. */
    currency: "",
    exchange_rate: "1",
  });
  const [lineas, setLineas] = useState<AsientoLineaInput[]>([emptyLine(), emptyLine()]);

  const exchangeRate = Number(header.exchange_rate) || 1;
  /** Escrita pero no valida: el backend responderia D4_MONEDA. Se para antes. */
  const monedaInvalida = header.currency.trim().length > 0 && !esIso4217(header.currency);
  const lineasPosteables = useMemo(
    () => lineas.filter((l) => l.cuenta_id && (l.debe_original > 0 || l.haber_original > 0)),
    [lineas],
  );
  const { totalDebe, totalHaber, cuadra } = useMemo(
    () => sumAsientoSides(lineasPosteables, exchangeRate),
    [lineasPosteables, exchangeRate],
  );

  const cuentaOptions = useMemo(
    () => cuentas.filter((c) => c.activa).map((c) => ({ value: c.id, label: `${c.codigo} · ${c.nombre}` })),
    [cuentas],
  );

  const loadMeta = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [ctrs, pers] = await Promise.all([
        listCuentas(tenantId, { activa: true }),
        listPeriodos(tenantId, new Date().getFullYear()),
      ]);
      setCuentas(ctrs);
      setPeriodos(pers.filter((p) => p.status === "open"));
      const open = pers.find((p) => p.status === "open");
      if (open) setHeader((h) => ({ ...h, periodo_id: h.periodo_id || open.id }));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  /**
   * `currency` se OMITE cuando el campo esta vacio, para que el backend aplique
   * la moneda funcional del tenant (asientos_router.py:258-259). Enviar una
   * moneda elegida a mano solo tiene sentido para un asiento en otra moneda, y
   * entonces el backend exige cotizacion oficial del dia.
   */
  const payload = (): CreateAsientoPayload => {
    const currency = currencyParaEnviar(header.currency);
    return {
      periodo_id: header.periodo_id,
      fecha: header.fecha,
      descripcion: header.descripcion,
      ...(currency ? { currency } : {}),
      exchange_rate: exchangeRate,
      lineas: lineasPosteables,
    };
  };

  const saveDraft = async () => {
    if (!tenantId) return;
    if (!header.periodo_id) {
      toast.error("Selecciona un periodo abierto");
      return;
    }
    if (monedaInvalida) {
      toast.error("La moneda debe ser un codigo ISO-4217 de tres letras");
      return;
    }
    setSaving(true);
    try {
      const row = await createAsiento(tenantId, payload());
      setDraftId(row.id);
      toast.success("Borrador guardado");
    } catch (e) {
      const moneda = e instanceof ContableApiError ? errorDeMoneda(e.message) : null;
      toast.error(moneda ? "No se pudo guardar el borrador" : "No se pudo guardar el borrador", {
        description: moneda ? moneda.copia : e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setSaving(false);
    }
  };

  const post = async () => {
    if (!tenantId || !cuadra) return;
    if (monedaInvalida) {
      toast.error("La moneda debe ser un codigo ISO-4217 de tres letras");
      return;
    }
    setPosting(true);
    try {
      let id = draftId;
      if (!id) {
        const row = await createAsiento(tenantId, payload());
        id = row.id;
        setDraftId(id);
      }
      await postAsiento(tenantId, id);
      toast.success("Asiento posteado");
      router.push("/contable/libro-mayor");
    } catch (e) {
      const moneda = e instanceof ContableApiError ? errorDeMoneda(e.message) : null;
      toast.error("No se pudo postear", {
        description: moneda ? moneda.copia : e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setPosting(false);
    }
  };

  const updateLine = (idx: number, patch: Partial<AsientoLineaInput>) => {
    setLineas((rows) => {
      const next = [...rows];
      const current = { ...next[idx]!, ...patch };
      if (patch.debe_original != null && patch.debe_original > 0) current.haber_original = 0;
      if (patch.haber_original != null && patch.haber_original > 0) current.debe_original = 0;
      next[idx] = current;
      return next;
    });
  };

  if (loading) {
    return (
      <ContablePageShell title="Crear asiento" description="Cargando catálogo…" icon={<FilePenLine className="h-10 w-10" />}>
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </ContablePageShell>
    );
  }

  return (
    <ContablePageShell
      title="Crear asiento"
      description="Doble partida con indicador de cuadre en vivo antes de postear."
      icon={<FilePenLine className="h-10 w-10" aria-hidden />}
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" disabled={saving} onClick={() => void saveDraft()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar borrador"}
          </Button>
          <Button
            disabled={!cuadra || posting}
            title={!cuadra ? "El asiento debe cuadrar (debe = haber) antes de postear" : undefined}
            onClick={() => void post()}
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Postear"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-white/10 p-4">
          <h2 className="text-sm font-bold text-white">Cabecera</h2>
          <Select
            label="Periodo (abierto)"
            value={header.periodo_id}
            onChange={(e) => setHeader((h) => ({ ...h, periodo_id: e.target.value }))}
            options={[
              { value: "", label: "— Seleccionar —", disabled: true },
              ...periodos.map((p) => ({ value: p.id, label: p.label })),
            ]}
          />
          <Input label="Fecha" type="date" value={header.fecha} onChange={(e) => setHeader((h) => ({ ...h, fecha: e.target.value }))} />
          <Input label="Descripción" value={header.descripcion} onChange={(e) => setHeader((h) => ({ ...h, descripcion: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Moneda (ISO-4217)"
              placeholder="moneda funcional del tenant"
              maxLength={3}
              value={header.currency}
              onChange={(e) => setHeader((h) => ({ ...h, currency: e.target.value.toUpperCase() }))}
              data-testid="asiento-moneda"
              aria-describedby="asiento-moneda-ayuda"
            />
            <Input
              label="Tipo de cambio"
              type="number"
              step="0.0001"
              value={header.exchange_rate}
              onChange={(e) => setHeader((h) => ({ ...h, exchange_rate: e.target.value }))}
            />
          </div>
          <p id="asiento-moneda-ayuda" className="text-xs text-zinc-400">
            Dejala vacia para registrar en la moneda funcional del tenant: la resuelve el backend. Solo
            completala para un asiento en otra moneda, y entonces hace falta cotizacion oficial del dia.
          </p>
          {monedaInvalida ? (
            <p role="alert" data-testid="asiento-moneda-invalida" className="text-xs font-semibold text-amber-300">
              La moneda debe ser un codigo ISO-4217 de tres letras.
            </p>
          ) : null}
        </div>

        <BalanceIndicator totalDebe={totalDebe} totalHaber={totalHaber} />
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Líneas del asiento</h2>
          <Button variant="secondary" size="sm" onClick={() => setLineas((r) => [...r, emptyLine()])}>
            <Plus className="mr-1 h-3 w-3" /> Agregar línea
          </Button>
        </div>

        {lineas.map((line, idx) => (
          <div key={idx} className="grid gap-2 rounded-lg border border-white/10 p-3 md:grid-cols-5">
            <Select
              label="Cuenta"
              value={line.cuenta_id}
              onChange={(e) => updateLine(idx, { cuenta_id: e.target.value })}
              options={[{ value: "", label: "— Cuenta —" }, ...cuentaOptions]}
            />
            <Input
              label="Debe"
              type="number"
              min="0"
              step="0.01"
              value={line.debe_original || ""}
              onChange={(e) => updateLine(idx, { debe_original: Number(e.target.value) || 0 })}
            />
            <Input
              label="Haber"
              type="number"
              min="0"
              step="0.01"
              value={line.haber_original || ""}
              onChange={(e) => updateLine(idx, { haber_original: Number(e.target.value) || 0 })}
            />
            <Input
              label="Detalle"
              value={line.descripcion ?? ""}
              onChange={(e) => updateLine(idx, { descripcion: e.target.value })}
            />
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={lineas.length <= 2}
                onClick={() => setLineas((r) => r.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ContablePageShell>
  );
}
