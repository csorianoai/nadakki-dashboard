"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, Trash2, TestTube } from "lucide-react";
import { chFetch } from "@/lib/credit-hub/api/client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { toast } from "@/components/forge";

type CredentialEnvironment = "SANDBOX" | "LIVE";
type VerificationStatus = "VERIFICADO" | "FALLO" | "NO_VERIFICABLE" | "NOT_TESTED";

interface Credential {
  id: string;
  provider: string;
  environment: CredentialEnvironment;
  created_at: string;
  updated_at: string;
  last_four: string;
  verification_status: VerificationStatus;
  last_tested_at?: string;
}

interface CredentialListResponse {
  credentials: Credential[];
}

async function getCredentials(tenantId: string): Promise<CredentialListResponse> {
  return chFetch("/api/v2/institucion/credenciales", {
    tenantId,
    actorRole: "bank_admin",
  });
}

async function createCredential(
  tenantId: string,
  data: { provider: string; environment: CredentialEnvironment; secret: string }
): Promise<{ id: string }> {
  return chFetch("/api/v2/institucion/credenciales", {
    tenantId,
    actorRole: "bank_admin",
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function testCredential(tenantId: string, credentialId: string): Promise<{ status: VerificationStatus }> {
  return chFetch(`/api/v2/institucion/credenciales/${credentialId}/probar`, {
    tenantId,
    actorRole: "bank_admin",
    method: "POST",
    body: JSON.stringify({}),
  });
}

async function deleteCredential(tenantId: string, credentialId: string): Promise<void> {
  return chFetch(`/api/v2/institucion/credenciales/${credentialId}`, {
    tenantId,
    actorRole: "bank_admin",
    method: "DELETE",
  });
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  if (status === "VERIFICADO") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Verificado
      </div>
    );
  }
  
  if (status === "FALLO") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-medium">
        <XCircle className="w-3 h-3" />
        Falló
      </div>
    );
  }
  
  if (status === "NO_VERIFICABLE") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded text-xs font-medium">
        <AlertTriangle className="w-3 h-3" />
        No verificable
      </div>
    );
  }
  
  return (
    <div className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs font-medium">
      No probado
    </div>
  );
}

function CredentialCard({
  credential,
  onTest,
  onDelete,
  testing,
}: {
  credential: Credential;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
  testing: boolean;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{credential.provider}</h3>
            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
              {credential.environment}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">••••{credential.last_four}</p>
        </div>
        <StatusBadge status={credential.verification_status} />
      </div>

      {credential.verification_status === "NO_VERIFICABLE" && credential.environment === "LIVE" ? (
        <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-700 rounded text-xs text-yellow-300">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Credenciales en LIVE no verificables bloquean producción
        </div>
      ) : null}

      {credential.last_tested_at ? (
        <p className="text-xs text-slate-500 mb-3">
          Última prueba: {new Date(credential.last_tested_at).toLocaleString("es-DO")}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onTest(credential.id)}
          disabled={testing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded transition-colors"
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
          Probar
        </button>
        <button
          type="button"
          onClick={() => onDelete(credential.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}

function NewCredentialForm({ onClose, tenantId }: { onClose: () => void; tenantId: string }) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState("");
  const [environment, setEnvironment] = useState<CredentialEnvironment>("SANDBOX");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: { provider: string; environment: CredentialEnvironment; secret: string }) =>
      createCredential(tenantId, data),
    onSuccess: () => {
      toast.success("Credencial agregada");
      void queryClient.invalidateQueries({ queryKey: ["institucion-credenciales", tenantId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al agregar credencial");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim() || !secret.trim()) {
      toast.error("Provider y secret son requeridos");
      return;
    }
    createMutation.mutate({ provider: provider.trim(), environment, secret: secret.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Nueva credencial</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Proveedor
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Ej: TransUnion, DataCrédito, Banco Central"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Ambiente
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="SANDBOX"
                  checked={environment === "SANDBOX"}
                  onChange={(e) => setEnvironment(e.target.value as CredentialEnvironment)}
                  className="mr-2"
                />
                Sandbox
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="LIVE"
                  checked={environment === "LIVE"}
                  onChange={(e) => setEnvironment(e.target.value as CredentialEnvironment)}
                  className="mr-2"
                />
                Producción
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              API Key / Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-lg font-mono text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              No se almacena en el cliente. Se envía y se olvida.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg"
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CredentialVaultView() {
  const { apiTenantId } = useTenant();
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const credsQuery = useQuery({
    queryKey: ["institucion-credenciales", apiTenantId],
    queryFn: () => getCredentials(apiTenantId!),
    enabled: !!apiTenantId,
    retry: false,
  });

  const testMutation = useMutation({
    mutationFn: ({ tenantId, credentialId }: { tenantId: string; credentialId: string }) =>
      testCredential(tenantId, credentialId),
    onSuccess: (data) => {
      if (data.status === "VERIFICADO") {
        toast.success("Conexión verificada correctamente");
      } else if (data.status === "FALLO") {
        toast.error("La prueba de conexión falló");
      } else if (data.status === "NO_VERIFICABLE") {
        toast.warning("No se pudo verificar la conexión en este momento");
      }
      void queryClient.invalidateQueries({ queryKey: ["institucion-credenciales", apiTenantId] });
      setTestingId(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al probar credencial");
      setTestingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ tenantId, credentialId }: { tenantId: string; credentialId: string }) =>
      deleteCredential(tenantId, credentialId),
    onSuccess: () => {
      toast.success("Credencial eliminada");
      void queryClient.invalidateQueries({ queryKey: ["institucion-credenciales", apiTenantId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    },
  });

  const handleTest = (credentialId: string) => {
    if (!apiTenantId) return;
    setTestingId(credentialId);
    testMutation.mutate({ tenantId: apiTenantId, credentialId });
  };

  const handleDelete = (credentialId: string) => {
    if (!apiTenantId) return;
    if (!confirm("¿Eliminar esta credencial? Esta acción no se puede deshacer.")) return;
    deleteMutation.mutate({ tenantId: apiTenantId, credentialId });
  };

  if (credsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (credsQuery.error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <p className="text-sm text-red-400">Error al cargar credenciales</p>
      </div>
    );
  }

  const data = credsQuery.data;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Credential Vault</h2>
          <p className="text-sm text-slate-400 mt-1">
            {data.credentials.length} credencial(es) configurada(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Nueva credencial
        </button>
      </div>

      {/* Test states explanation */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h3 className="font-medium mb-2">Estados de verificación</h3>
        <div className="space-y-1 text-sm text-blue-300">
          <p><strong>✓ Verificado:</strong> Conexión exitosa, credenciales válidas</p>
          <p><strong>✗ Falló:</strong> Credenciales inválidas o proveedor rechazó</p>
          <p><strong>⚠ No verificable:</strong> No se pudo probar ahora (timeout, servicio caído). En LIVE, bloquea producción.</p>
        </div>
      </div>

      {/* Credentials grid */}
      {data.credentials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.credentials.map((cred) => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              onTest={handleTest}
              onDelete={handleDelete}
              testing={testingId === cred.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p>No hay credenciales configuradas</p>
          <p className="text-sm mt-1">Agrega tu primera credencial para comenzar</p>
        </div>
      )}

      {/* New credential form */}
      {showNewForm && apiTenantId ? (
        <NewCredentialForm onClose={() => setShowNewForm(false)} tenantId={apiTenantId} />
      ) : null}
    </div>
  );
}
