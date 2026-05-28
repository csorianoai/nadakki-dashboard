"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Modal, Select } from "@/components/forge";
import {
  ContableApiError,
  createCuenta,
  listCuentas,
  updateCuenta,
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { NaturalezaBadge, TipoCuentaBadge } from "@/components/contable/ContableBadges";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { CuentaContable, NaturalezaCuenta, TipoCuenta } from "@/types/contable";

const TIPOS: TipoCuenta[] = ["activo", "pasivo", "patrimonio", "ingreso", "gasto", "costo", "orden"];

function buildTree(cuentas: CuentaContable[]): (CuentaContable & { children: CuentaContable[] })[] {
  const byId = new Map(cuentas.map((c) => [c.id, { ...c, children: [] as CuentaContable[] }]));
  const roots: (CuentaContable & { children: CuentaContable[] })[] = [];
  for (const c of byId.values()) {
    if (c.cuenta_padre_id && byId.has(c.cuenta_padre_id)) {
      byId.get(c.cuenta_padre_id)!.children.push(c);
    } else {
      roots.push(c);
    }
  }
  const sortRec = (nodes: (CuentaContable & { children: CuentaContable[] })[]) => {
    nodes.sort((a, b) => a.codigo.localeCompare(b.codigo));
    for (const n of nodes) sortRec(n.children as (CuentaContable & { children: CuentaContable[] })[]);
  };
  sortRec(roots);
  return roots;
}

function TreeRow({
  node,
  depth,
  onEdit,
  onToggle,
}: {
  node: CuentaContable & { children?: CuentaContable[] };
  depth: number;
  onEdit: (c: CuentaContable) => void;
  onToggle: (c: CuentaContable) => void;
}) {
  return (
    <>
      <tr className={node.activa ? "border-b border-white/5" : "border-b border-white/5 opacity-50"}>
        <td className="px-4 py-2 font-mono text-xs" style={{ paddingLeft: `${16 + depth * 20}px` }}>
          {node.codigo}
        </td>
        <td className="px-4 py-2">{node.nombre}</td>
        <td className="px-4 py-2"><TipoCuentaBadge tipo={node.tipo_cuenta} /></td>
        <td className="px-4 py-2"><NaturalezaBadge naturaleza={node.naturaleza} /></td>
        <td className="px-4 py-2 text-xs text-zinc-500">{node.activa ? "Activa" : "Inactiva"}</td>
        <td className="px-4 py-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(node)}>Editar</Button>
            <Button variant="ghost" size="sm" onClick={() => onToggle(node)}>
              {node.activa ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </td>
      </tr>
      {(node.children ?? []).map((child) => (
        <TreeRow key={child.id} node={child} depth={depth + 1} onEdit={onEdit} onToggle={onToggle} />
      ))}
    </>
  );
}

export function PlanCuentasClient() {
  const tenantId = useContableTenantId();
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CuentaContable | null>(null);
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    tipo_cuenta: "activo" as TipoCuenta,
    naturaleza: "deudora" as NaturalezaCuenta,
    cuenta_padre_id: "",
  });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const rows = await listCuentas(tenantId, {
        tipo_cuenta: tipoFilter ? (tipoFilter as TipoCuenta) : undefined,
        search: search || undefined,
      });
      setCuentas(rows);
    } catch (e) {
      toast.error("Error cargando plan de cuentas", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, tipoFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const tree = useMemo(() => buildTree(cuentas), [cuentas]);

  const saveCreate = async () => {
    if (!tenantId) return;
    try {
      await createCuenta(tenantId, {
        codigo: form.codigo,
        nombre: form.nombre,
        tipo_cuenta: form.tipo_cuenta,
        naturaleza: form.naturaleza,
        cuenta_padre_id: form.cuenta_padre_id || null,
      });
      toast.success("Cuenta creada");
      setCreateOpen(false);
      void load();
    } catch (e) {
      toast.error("No se pudo crear la cuenta", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    }
  };

  const saveEdit = async () => {
    if (!tenantId || !editTarget) return;
    try {
      await updateCuenta(tenantId, editTarget.id, {
        nombre: form.nombre,
        tipo_cuenta: form.tipo_cuenta,
        naturaleza: form.naturaleza,
      });
      toast.success("Cuenta actualizada");
      setEditTarget(null);
      void load();
    } catch (e) {
      toast.error("No se pudo actualizar", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    }
  };

  const toggleActiva = async (c: CuentaContable) => {
    if (!tenantId) return;
    try {
      await updateCuenta(tenantId, c.id, { activa: !c.activa });
      void load();
    } catch (e) {
      toast.error("Error", { description: e instanceof ContableApiError ? e.message : "" });
    }
  };

  return (
    <ContablePageShell
      title="Plan de cuentas"
      description="Catálogo jerárquico de cuentas contables del tenant."
      icon={<BookOpen className="h-10 w-10" aria-hidden />}
      actions={<Button onClick={() => { setForm({ codigo: "", nombre: "", tipo_cuenta: "activo", naturaleza: "deudora", cuenta_padre_id: "" }); setCreateOpen(true); }}>+ Nueva cuenta</Button>}
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          label="Tipo"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          options={[{ value: "", label: "Todos los tipos" }, ...TIPOS.map((t) => ({ value: t, label: t }))]}
        />
        <Input label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código o nombre…" />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando plan de cuentas…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Naturaleza</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((node) => (
                <TreeRow key={node.id} node={node} depth={0} onEdit={(c) => {
                  setEditTarget(c);
                  setForm({ codigo: c.codigo, nombre: c.nombre, tipo_cuenta: c.tipo_cuenta, naturaleza: c.naturaleza, cuenta_padre_id: c.cuenta_padre_id ?? "" });
                }} onToggle={toggleActiva} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva cuenta"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={() => void saveCreate()}>Guardar</Button></div>}>
        <div className="space-y-3">
          <Input label="Código" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <Select label="Tipo" value={form.tipo_cuenta} onChange={(e) => setForm((f) => ({ ...f, tipo_cuenta: e.target.value as TipoCuenta }))} options={TIPOS.map((t) => ({ value: t, label: t }))} />
          <Select label="Naturaleza" value={form.naturaleza} onChange={(e) => setForm((f) => ({ ...f, naturaleza: e.target.value as NaturalezaCuenta }))} options={[{ value: "deudora", label: "Deudora" }, { value: "acreedora", label: "Acreedora" }]} />
          <Select label="Cuenta padre" value={form.cuenta_padre_id} onChange={(e) => setForm((f) => ({ ...f, cuenta_padre_id: e.target.value }))}
            options={[{ value: "", label: "— Raíz —" }, ...cuentas.map((c) => ({ value: c.id, label: `${c.codigo} · ${c.nombre}` }))]} />
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Editar ${editTarget?.codigo ?? ""}`}
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button><Button onClick={() => void saveEdit()}>Guardar</Button></div>}>
        <div className="space-y-3">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <Select label="Tipo" value={form.tipo_cuenta} onChange={(e) => setForm((f) => ({ ...f, tipo_cuenta: e.target.value as TipoCuenta }))} options={TIPOS.map((t) => ({ value: t, label: t }))} />
          <Select label="Naturaleza" value={form.naturaleza} onChange={(e) => setForm((f) => ({ ...f, naturaleza: e.target.value as NaturalezaCuenta }))} options={[{ value: "deudora", label: "Deudora" }, { value: "acreedora", label: "Acreedora" }]} />
        </div>
      </Modal>
    </ContablePageShell>
  );
}
