'use client';
import { useState } from 'react';
interface CoreAgentCardProps {
  agent: { id: string; name: string; fileName: string; type: 'IA' | 'Agent'; status: 'active' | 'inactive'; inactiveReason?: string; path: string; module: string; backendModule: string };
  showDetails?: boolean;
}
export default function CoreAgentCard({ agent, showDetails = false }: CoreAgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const getStatusColor = (status: string) => status === 'active' ? 'border-l-green-500 bg-green-50' : 'border-l-yellow-500 bg-yellow-50';
  const getStatusText = (status: string) => status === 'active' ? '✅ Activo' : '⏸️ Inactivo';
  const getTypeColor = (type: string) => type === 'IA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  const getInactiveReason = (reason?: string) => {
    if (!reason) return '';
    switch (reason) {
      case 'in_backup': return '(En backup)';
      case 'in_legacy': return '(En legacy)';
      case 'test_file': return '(Test)';
      default: return '';
    }
  };
  return (
    <div className={\order-l-4 rounded-r-lg p-4 mb-3 transition-all hover:shadow-md cursor-pointer \\} onClick={() => setExpanded(!expanded)}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2"><h3 className="font-semibold text-gray-900">{agent.name}</h3><span className={\	ext-xs px-2 py-1 rounded-full \\}>{agent.type}</span></div>
          <div className="flex items-center gap-3 text-sm"><span className={\px-2 py-1 rounded-full text-xs font-medium \\}>{getStatusText(agent.status)}</span>{agent.status === 'inactive' && agent.inactiveReason && <span className="text-gray-500 text-xs">{getInactiveReason(agent.inactiveReason)}</span>}</div>
        </div>
        <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>{expanded ? '▲' : '▼'}</button>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><div className="text-gray-500 mb-1">Archivo</div><div className="font-mono text-xs bg-gray-100 p-2 rounded">{agent.fileName}</div></div>
            <div><div className="text-gray-500 mb-1">Core</div><div className="text-xs font-medium px-2 py-1 bg-gray-200 rounded">{agent.backendModule || 'N/A'}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
