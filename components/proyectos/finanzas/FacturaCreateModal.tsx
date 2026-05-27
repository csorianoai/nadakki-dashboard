"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button, Input, Modal, Select } from "@/components/forge";
import { createFactura, listOrdenesCompra } from "@/app/hooks/useProyectos";
import type { CreateFacturaPayload, LineItem, OrdenCompra } from "@/types/finanzas";

function emptyLine(): LineItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unit_price_usd: 0, amount_usd: 0 };
}

export function FacturaCreateModal({
  open,
  tenantId,
  projectId,
  onClose,
  onCreated,
}: {
  open: boolean;
  tenantId: string;
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [ocs, setOcs] = useState<OrdenCompra[]>([]);
  const [form, setForm] = useState({
    orden_compra_id: "",
    contratista_id: "cont-001",
    contratista_nombre: "Constructora del Caribe SRL",
    numero_factura: "",
    fecha_emision: new Date().toISOString().slice(0, 10),
    line_items: [emptyLine()],
  });

  useEffect(() => {
    if (!open || !tenantId) return;
    void listOrdenesCompra(tenantId, projectId).then((r) => setOcs(r.items));
    setStep(1);
    setForm({
      orden_compra_id: "",
      contratista_id: "cont-001",
      contratista_nombre: "Constructora del Caribe SRL",
      numero_factura: "",
      fecha_emision: new Date().toISOString().slice(0, 10),
      line_items: [emptyLine()],
    });
  }, [open, tenantId, projectId]);

  const monto = form.line_items.reduce((s, li) => s + li.quantity * li.unit_price_usd, 0);

  const save = async () => {
    setSaving(true);
    try {
      const line_items = form.line_items.map((li) => ({
        ...li,
        amount_usd: li.quantity * li.unit_price_usd,
      }));
      const payload: CreateFacturaPayload = {
        tenant_id: tenantId,
        project_id: projectId,
        orden_compra_id: form.orden_compra_id || undefined,
        contratista_id: form.contratista_id,
        contratista_nombre: form.contratista_nombre,
        numero_factura: form.numero_factura || `FAC-${Date.now()}`,
        monto_total_usd: monto,
        currency: "USD",
        fecha_emision: form.fecha_emision,
        line_items,
      };
      await createFactura(tenantId, projectId, payload);
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!saving) onClose();
  }, [saving, onClose]);

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={handleClose} />,
          document.body,
        )
      : null;

  return (
    <>
      {overlay}
      <Modal
        open={open}
        onClose={handleClose}
        closeOnBackdropClick={false}
        className="!z-50 backdrop:bg-transparent max-w-2xl"
        title="Nueva factura"
        description={`Paso ${step} de 2 — datos básicos y líneas`}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={saving} onClick={handleClose}>
              Cancelar
            </Button>
            {step === 1 ? (
              <Button type="button" onClick={() => setStep(2)} disabled={!form.numero_factura.trim()}>
                Siguiente
              </Button>
            ) : (
              <Button type="button" disabled={saving || monto <= 0} onClick={() => void save()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar factura"}
              </Button>
            )}
          </div>
        }
      >
        {step === 1 ? (
          <div className="space-y-4">
            <Select
              label="Orden de compra (recomendado)"
              value={form.orden_compra_id}
              onChange={(e) => {
                const oc = ocs.find((o) => o.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  orden_compra_id: e.target.value,
                  contratista_id: oc?.contratista_id ?? f.contratista_id,
                  contratista_nombre: oc?.contratista_nombre ?? f.contratista_nombre,
                }));
              }}
              options={[{ value: "", label: "Sin OC" }, ...ocs.map((o) => ({ value: o.id, label: o.numero_oc }))]}
            />
            <Input label="Número factura" value={form.numero_factura} onChange={(e) => setForm((f) => ({ ...f, numero_factura: e.target.value }))} />
            <Input label="Contratista" value={form.contratista_nombre} onChange={(e) => setForm((f) => ({ ...f, contratista_nombre: e.target.value }))} />
            <Input label="Fecha emisión" type="date" value={form.fecha_emision} onChange={(e) => setForm((f) => ({ ...f, fecha_emision: e.target.value }))} />
          </div>
        ) : (
          <div className="space-y-3">
            {form.line_items.map((li, idx) => (
              <div key={li.id} className="grid gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-4">
                <Input
                  label="Descripción"
                  value={li.description}
                  onChange={(e) => {
                    const items = [...form.line_items];
                    items[idx] = { ...li, description: e.target.value };
                    setForm((f) => ({ ...f, line_items: items }));
                  }}
                />
                <Input
                  label="Cant."
                  type="number"
                  value={String(li.quantity)}
                  onChange={(e) => {
                    const items = [...form.line_items];
                    items[idx] = { ...li, quantity: Number(e.target.value) || 0 };
                    setForm((f) => ({ ...f, line_items: items }));
                  }}
                />
                <Input
                  label="Precio USD"
                  type="number"
                  value={String(li.unit_price_usd)}
                  onChange={(e) => {
                    const items = [...form.line_items];
                    items[idx] = { ...li, unit_price_usd: Number(e.target.value) || 0 };
                    setForm((f) => ({ ...f, line_items: items }));
                  }}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setForm((f) => ({ ...f, line_items: f.line_items.filter((_, i) => i !== idx) }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setForm((f) => ({ ...f, line_items: [...f.line_items, emptyLine()] }))}>
              <Plus className="mr-2 h-4 w-4" /> Línea
            </Button>
            <p className="text-sm text-amber-200">Total: ${monto.toLocaleString("es-DO")}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
