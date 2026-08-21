"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, AlertCircle, Save } from "lucide-react";
import { chFetch } from "@/lib/credit-hub/api/client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { toast } from "@/components/forge";

type ConfigBlock = 
  | "datos_generales"
  | "prestamistas" 
  | "buro"
  | "politica_documental"
  | "cumplimiento"
  | "bancos_destino"
  | "representante_legal";

interface BlockStatus {
  block_id: ConfigBlock;
  complete: boolean;
  last_updated?: string;
}

interface ConfiguracionResponse {
  institution_type: "BANCO" | "DEALER";
  blocks: BlockStatus[];
  overall_progress: number;
}

interface BlockData {
  [key: string]: any;
}

async function getConfiguracion(tenantId: string): Promise<ConfiguracionResponse> {
  return chFetch("/api/v2/institucion/configuracion", {
    tenantId,
    actorRole: "bank_admin",
  });
}

async function getBlock(tenantId: string, blockId: string): Promise<BlockData> {
  return chFetch(`/api/v2/institucion/configuracion/${blockId}`, {
    tenantId,
    actorRole: "bank_admin",
  });
}

async function saveBlock(tenantId: string, blockId: string, data: BlockData): Promise<void> {
  return chFetch(`/api/v2/institucion/configuracion/${blockId}`, {
    tenantId,
    actorRole: "bank_admin",
    method: "PUT",
    body: JSON.stringify(data),
  });
}

const BLOCK_LABELS: Record<ConfigBlock, { title: string; description: string }> = {
  datos_generales: {
    title: "Datos generales",
    description: "Información básica de la institución",
  },
  prestamistas: {
    title: "Prestamistas",
    description: "Configuración de lenders y productos",
  },
  buro: {
    title: "Buró de crédito",
    description: "Conexión y configuración de buró",
  },
  politica_documental: {
    title: "Política documental",
    description: "Documentos requeridos por tipo de solicitud",
  },
  cumplimiento: {
    title: "Cumplimiento",
    description: "Políticas de KYC, AML y Ley 172-13",
  },
  bancos_destino: {
    title: "Bancos destino",
    description: "Bancos a los que despacha este dealer",
  },
  representante_legal: {
    title: "Representante legal",
    description: "Información del representante legal del dealer",
  },
};

function BlockCard({
  block,
  onEdit,
}: {
  block: BlockStatus;
  onEdit: (blockId: ConfigBlock) => void;
}) {
  const info = BLOCK_LABELS[block.block_id];
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{info.title}</h3>
            {block.complete ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-slate-400">{info.description}</p>
          {block.last_updated ? (
            <p className="text-xs text-slate-500 mt-2">
              Actualizado: {new Date(block.last_updated).toLocaleDateString("es-DO")}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-2">Sin configurar</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEdit(block.block_id)}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {block.complete ? "Editar" : "Configurar"}
        </button>
      </div>
    </div>
  );
}

function BlockEditor({
  blockId,
  tenantId,
  onClose,
}: {
  blockId: ConfigBlock;
  tenantId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BlockData>({});
  
  const blockQuery = useQuery({
    queryKey: ["config-block", tenantId, blockId],
    queryFn: () => getBlock(tenantId, blockId),
    enabled: !!tenantId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: BlockData) => saveBlock(tenantId, blockId, data),
    onSuccess: () => {
      toast.success("Bloque guardado correctamente");
      void queryClient.invalidateQueries({ queryKey: ["institucion-configuracion", tenantId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    },
  });

  const info = BLOCK_LABELS[blockId];

  if (blockQuery.isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full mx-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2">{info.title}</h2>
        <p className="text-slate-400 mb-6">{info.description}</p>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              Este es un placeholder. La implementación completa requiere campos específicos por bloque
              según el tipo de institución (BANCO vs DEALER).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Datos de configuración (JSON)
            </label>
            <textarea
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-sm"
              rows={10}
              value={JSON.stringify(blockQuery.data || {}, null, 2)}
              onChange={(e) => {
                try {
                  setFormData(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              placeholder="{}"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg transition-colors"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfiguracionView() {
  const { apiTenantId } = useTenant();
  const [editingBlock, setEditingBlock] = useState<ConfigBlock | null>(null);

  const configQuery = useQuery({
    queryKey: ["institucion-configuracion", apiTenantId],
    queryFn: () => getConfiguracion(apiTenantId!),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (configQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (configQuery.error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <p className="text-sm text-red-400">Error al cargar la configuración</p>
      </div>
    );
  }

  const data = configQuery.data;
  if (!data) return null;

  const completeBlocks = data.blocks.filter((b) => b.complete).length;
  const totalBlocks = data.blocks.length;

  return (
    <div className="space-y-6">
      {/* Progress overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">
              Configuración de {data.institution_type === "BANCO" ? "banco" : "concesionario"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {completeBlocks} de {totalBlocks} bloques completados
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-500">{data.overall_progress}%</div>
            <div className="text-xs text-slate-400">Progreso general</div>
          </div>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${data.overall_progress}%` }}
          />
        </div>
      </div>

      {/* Blocks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.blocks.map((block) => (
          <BlockCard key={block.block_id} block={block} onEdit={setEditingBlock} />
        ))}
      </div>

      {/* Block editor modal */}
      {editingBlock && apiTenantId ? (
        <BlockEditor
          blockId={editingBlock}
          tenantId={apiTenantId}
          onClose={() => setEditingBlock(null)}
        />
      ) : null}

      {/* Cumplimiento note */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          <strong>Nota:</strong> El bloque de cumplimiento es obligatorio antes de operar, pero no bloquea la
          exploración. Se muestra como pendiente con aviso de qué habilita.
        </p>
      </div>
    </div>
  );
}
