"use client";
import { ContactoSelector } from "@/app/autos/dealer/contactos/ContactoSelector";
import { EMPTY_LINE, FX_SOURCES, type PurchaseForm } from "@/lib/dealer-management/vehicle-purchase";

export function VehiclePurchaseFields({ value: p, onChange, disabled }: { value: PurchaseForm; onChange: (p: PurchaseForm) => void; disabled?: boolean }) {
  const set = (key: keyof PurchaseForm, value: string) => onChange({ ...p, [key]: value });
  const input = (key: Exclude<keyof PurchaseForm, "payment_lines">, label: string, type = "text", maxLength?: number) => <label className="block" key={key}>{label}<input className="block w-full rounded border border-nk-border bg-nk-surface p-2 text-nk-fg" type={type} maxLength={maxLength} value={p[key]} onChange={(e) => set(key, e.target.value)} /></label>;
  return <fieldset disabled={disabled} className="space-y-3 rounded border border-nk-border bg-nk-surface p-4 text-nk-fg">
    <legend className="text-lg font-bold">Compra</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {input("cost", "Costo de compra")}{input("currency", "Moneda de compra (3 letras)", "text", 3)}
      {input("acquired_on", "Fecha de adquisición", "date")}{input("country_code", "País de adquisición (2 letras)", "text", 2)}
      {input("acquisition_mode_code", "Modo de adquisición", "text", 40)}
      <p className="text-sm">Usa el código vigente de tu concesionario; stock_inicial corresponde al inventario inicial. El servidor valida los códigos disponibles.</p>
      {input("engine_number", "Número de motor (privado)", "text", 40)}
      <ContactoSelector value={p.seller_contact_id} onChange={(v) => set("seller_contact_id", v)} disabled={disabled} />
    </div>
    <h3>Líneas de pago</h3>
    {p.payment_lines.map((pay, i) => {
      const update = (key: string, value: string) => onChange({ ...p, payment_lines: p.payment_lines.map((r, n) => n === i ? { ...r, [key]: value } : r) });
      return <fieldset key={i} className="grid gap-2 border border-nk-border p-2 sm:grid-cols-2"><legend>Pago {i + 1}</legend>
        <label>Medio de pago<select className="block" value={pay.method} onChange={(e) => update("method", e.target.value)}>{["cash", "transfer", "cheque", "other"].map((m) => <option key={m} value={m}>{{ cash: "Efectivo", transfer: "Transferencia", cheque: "Cheque", other: "Otro" }[m]}</option>)}</select></label>
        <label>Importe del pago<input className="block" value={pay.amount} onChange={(e) => update("amount", e.target.value)} /></label>
        {pay.method === "cheque" && <>
          <label>Número de cheque<input maxLength={40} value={pay.cheque_number} onChange={(e) => update("cheque_number", e.target.value)} /></label>
          <label>Banco<input maxLength={80} value={pay.bank} onChange={(e) => update("bank", e.target.value)} /></label>
          <label>Fecha de cobro<input type="date" value={pay.cobro_date} onChange={(e) => update("cobro_date", e.target.value)} /></label>
        </>}
        {pay.method === "other" && <label>Detalle del pago<input maxLength={200} value={pay.detail} onChange={(e) => update("detail", e.target.value)} /></label>}
        <button type="button" disabled={p.payment_lines.length === 1} onClick={() => onChange({ ...p, payment_lines: p.payment_lines.filter((_, n) => n !== i) })}>Quitar pago {i + 1}</button>
      </fieldset>;
    })}
    <button type="button" disabled={p.payment_lines.length >= 20} onClick={() => onChange({ ...p, payment_lines: [...p.payment_lines, { ...EMPTY_LINE }] })}>Agregar pago</button>
    <h3>Tipo de cambio de la operación (opcional)</h3>
    {input("fx_rate", "Tasa manual")}
    <label>Fuente del tipo de cambio<select value={p.fx_source} onChange={(e) => onChange({ ...p, fx_source: e.target.value, fx_source_detail: "" })}><option value="">Seleccionar fuente</option>{FX_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
    {p.fx_source === "otra" && input("fx_source_detail", "Detalle de otra fuente", "text", 200)}
    {input("fx_as_of", "Fecha del tipo de cambio", "date")}
    <h3>Documentación informativa</h3>
    <p>Disponible cuando exista un endpoint para registrar la recepción del checklist. No bloquea la compra ni la venta.</p>
    {["Título", "Formulario 08", "Cédula", "VTV", "Cheque"].map((d) => <label className="block" key={d}><input type="checkbox" disabled /> {d}</label>)}
  </fieldset>;
}
