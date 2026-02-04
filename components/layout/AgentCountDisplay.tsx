'use client';

import { useAgents } from '@/hooks/useAgents';

interface AgentCountDisplayProps {
  format?: 'number' | 'text' | 'badge' | 'full';
  showLabel?: boolean;
}

export function AgentCountDisplay({
  format = 'number',
  showLabel = true
}: AgentCountDisplayProps) {
  const { totalAgents, loading, error } = useAgents();

  if (loading) return <span>—</span>;
  if (error || totalAgents === null) return <span title={error || 'Error'}>?</span>;

  if (format === 'full') {
    return (
      <div style={{
        padding: '8px 10px',
        margin: '10px',
        borderRadius: '8px',
        background: 'rgba(139, 92, 246, 0.1)',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#a55eea' }}>
            {totalAgents}
          </div>
          <div style={{ fontSize: '7px', color: '#64748b' }}>AGENTES</div>
        </div>
      </div>
    );
  }

  return <span>{totalAgents}</span>;
}
