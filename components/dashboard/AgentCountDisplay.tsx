interface AgentCountDisplayProps {
  count: number;
}

export default function AgentCountDisplay({ count }: AgentCountDisplayProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-green-400">{count}</div>
        <div className="text-sm text-gray-400">AGENTES TOTALES</div>
      </div>
      <div className="rounded-full bg-green-900/30 p-2">
        <span className="text-lg">🤖</span>
      </div>
    </div>
  );
}
