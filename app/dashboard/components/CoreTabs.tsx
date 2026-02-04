'use client';
interface CoreTab { id: string; displayName: string; activeCount: number; inactiveCount: number; totalCount: number; color: string; }
interface CoreTabsProps { cores: CoreTab[]; activeCore: string; onCoreChange: (coreId: string) => void; }
export default function CoreTabs({ cores, activeCore, onCoreChange }: CoreTabsProps) {
  const colorMap: Record<string, string> = { 'blue': '#3b82f6', 'green': '#10b981', 'red': '#ef4444', 'yellow': '#eab308', 'purple': '#a855f7', 'pink': '#ec4899', 'indigo': '#6366f1', 'teal': '#14b8a6', 'gray': '#6b7280' };
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex space-x-2 min-w-max">
        <button onClick={() => onCoreChange('all')} className={\lex flex-col items-center px-6 py-4 rounded-xl transition-all \\}>
          <div className="text-lg font-bold">{cores.reduce((sum, c) => sum + c.totalCount, 0)}</div>
          <div className="text-sm mt-1">Todos</div>
        </button>
        {cores.map(core => (
          <button key={core.id} onClick={() => onCoreChange(core.id)} className={\lex flex-col items-center px-6 py-4 rounded-xl transition-all \\} style={activeCore === core.id ? { backgroundColor: colorMap[core.color] } : {}}>
            <div className="text-lg font-bold">{core.totalCount}</div>
            <div className="text-sm mt-1">{core.displayName}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
