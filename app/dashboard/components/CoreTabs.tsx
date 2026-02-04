'use client';

interface CoreTab {
  id: string;
  name: string;
  displayName: string;
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
  color: string;
}

interface CoreTabsProps {
  cores: CoreTab[];
  activeCore: string;
  onCoreChange: (coreId: string) => void;
}

export default function CoreTabs({ cores, activeCore, onCoreChange }: CoreTabsProps) {
  const colorMap: Record<string, string> = {
    'blue': '#3b82f6',
    'green': '#10b981',
    'red': '#ef4444',
    'yellow': '#eab308',
    'purple': '#a855f7',
    'pink': '#ec4899',
    'indigo': '#6366f1',
    'teal': '#14b8a6',
    'gray': '#6b7280',
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex space-x-2 min-w-max">
        {/* Tab "Todos" */}
        <button
          onClick={() => onCoreChange('all')}
          className={`flex flex-col items-center px-6 py-4 rounded-xl transition-all min-w-fit ${
            activeCore === 'all'
              ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
          aria-label="Ver todos los agentes"
        >
          <div className="text-lg font-bold">
            {cores.reduce((sum, core) => sum + core.totalCount, 0)}
          </div>
          <div className="text-sm mt-1">Todos</div>
          <div className="flex gap-1 mt-2 text-xs">
            <span className="text-green-600">✅ {cores.reduce((sum, core) => sum + core.activeCount, 0)}</span>
            <span className="text-yellow-600">⏸️ {cores.reduce((sum, core) => sum + core.inactiveCount, 0)}</span>
          </div>
        </button>

        {/* Tabs para cada core */}
        {cores.map((core) => (
          <button
            key={core.id}
            onClick={() => onCoreChange(core.id)}
            className={`flex flex-col items-center px-6 py-4 rounded-xl transition-all min-w-fit ${
              activeCore === core.id
                ? 'text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
            style={activeCore === core.id ? { backgroundColor: colorMap[core.color] } : {}}
            aria-label={`Ver core ${core.displayName}`}
          >
            <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: colorMap[core.color] }}></div>
            <div className="text-lg font-bold">{core.totalCount}</div>
            <div className="text-sm mt-1 whitespace-nowrap">{core.displayName}</div>
            <div className="flex gap-1 mt-2 text-xs">
              <span>✅ {core.activeCount}</span>
              <span>⏸️ {core.inactiveCount}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
