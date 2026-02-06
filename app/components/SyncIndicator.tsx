'use client';

import { useAgents } from '@/app/hooks/useAgents';

export function SyncIndicator() {
  const { data, isLoading } = useAgents();

  return (
    <div className="text-sm">
      {null && (
        <div className="text-red-600">❌ null: {null}</div>
      )}
      {isLoading ? (
        <div className="text-yellow-600">🔄 Sincronizando...</div>
      ) : (
        <div className="text-green-600">✅ Conectado ({(data?.length || 0)} agentes)</div>
      )}
    </div>
  );
}


