'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { CORES_CONFIG } from '@/config/cores';
import { api } from '@/lib/api';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coreId = params.core as string;
  const agentId = params.agentId as string;
  const coreConfig = CORES_CONFIG[coreId];

  const [inputData, setInputData] = useState('{\n  "test": true\n}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedInput = JSON.parse(inputData);
      const response = await api.executeAgent(coreId, agentId, parsedInput);
      setResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!coreConfig) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-80 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-gray-400">Core no encontrado</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-80">
        <Header
          title={agentId}
          subtitle={coreConfig.displayName + ' - Agente de IA'}
          coreColor={coreConfig.color}
        />
        <div className="p-8">
          <button onClick={() => router.back()} className="mb-6 text-gray-400 hover:text-white">
            Volver
          </button>

          <div className="grid grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4" style={{color: coreConfig.color}}>Input</h2>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full h-64 bg-black/50 border border-white/20 rounded-xl p-4 font-mono text-sm text-white"
              />
              <button
                onClick={executeAgent}
                disabled={loading}
                className="w-full mt-4 py-4 rounded-xl font-bold text-black"
                style={{background: coreConfig.gradient}}
              >
                {loading ? 'Ejecutando...' : 'Ejecutar'}
              </button>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-green-400">Resultado</h2>
              {error && <div className="bg-red-500/20 p-4 rounded-xl mb-4 text-red-400">{error}</div>}
              {result ? (
                <pre className="bg-black/50 rounded-xl p-4 text-xs overflow-auto max-h-80">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Ejecuta el agente para ver resultados
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
