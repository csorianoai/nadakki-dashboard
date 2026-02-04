'use client';

import { useAgents } from '@/hooks/useAgents';

export function SyncIndicator() {
  const { loading, error, totalAgents } = useAgents();

  return (
    <div className="text-sm">
      {error && (
        <div className="text-red-600">❌ Error: {error}</div>
      )}
      {loading ? (
        <div className="text-yellow-600">🔄 Sincronizando...</div>
      ) : (
        <div className="text-green-600">✅ Conectado ({totalAgents} agentes)</div>
      )}
    </div>
  );
}
