'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description?: string;
  available?: boolean;
}

export default function AgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(
          'https://nadakki-ai-suite.onrender.com/api/v1/agents'
        );
        
        if (!response.ok) throw new Error('Failed to fetch agents');
        
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleExecuteAgent = async (agentId: string) => {
    setExecuting(agentId);
    setResult(null);
    
    try {
      const response = await fetch(
        `https://nadakki-ai-suite.onrender.com/api/v1/agents/${agentId}/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'demo'
          },
          body: JSON.stringify({
            tenant_id: 'demo',
            params: {}
          })
        }
      );
      
      const data = await response.json();
      setResult({
        agent: agentId,
        status: data.status || 'completed',
        data: data
      });
    } catch (err) {
      setResult({
        agent: agentId,
        status: 'error',
        error: err instanceof Error ? err.message : 'Execution failed'
      });
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return <div className="p-6 bg-white rounded-lg shadow animate-pulse">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow border border-red-200">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Available Agents ({agents.length})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {agents.map((agent) => (
          <div key={agent.id} className="p-4 border rounded-lg bg-blue-50">
            <h3 className="font-bold text-lg text-blue-900">{agent.name}</h3>
            {agent.description && <p className="text-sm text-blue-700 my-2">{agent.description}</p>}
            <button
              onClick={() => handleExecuteAgent(agent.id)}
              disabled={executing === agent.id}
              className="mt-3 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              {executing === agent.id ? 'Executing...' : 'Execute'}
            </button>
          </div>
        ))}
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-bold mb-2">{result.status === 'error' ? '❌ Error' : '✅ Result'}</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
