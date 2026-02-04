# 🔄 SINCRONIZACIÓN BACKEND → FRONTEND

## ¿QUÉ SE HIZO?

Backend (Python/Node) genera: public/data/all-agents-structure.json
Frontend (React) ahora carga: Los datos del JSON automáticamente
Resultado: Tus números se actualizan solos

## ¿CÓMO USARLO?

### 1. En cualquier componente que necesite datos:

\\\	sx
import { useAgents } from '@/hooks/useAgents';

export default function MiComponente() {
  const { 
    agents,           // Todos los agentes
    activeCount,      // 70 agentes activos
    inactiveCount,    // 169 agentes inactivos
    totalAgents,      // 239 agentes total
    loading,          // ¿Está cargando?
    error             // ¿Hay error?
  } = useAgents();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Total: {totalAgents}</h1>
      <p>Activos: {activeCount}</p>
      <p>Inactivos: {inactiveCount}</p>
      
      {/* Mostrar agentes */}
      {agents.map(agent => (
        <div key={agent.id}>{agent.name}</div>
      ))}
    </div>
  );
}
\\\

### 2. Ver estado de sincronización (opcional):

\\\	sx
import { SyncIndicator } from '@/components/SyncIndicator';

export default function Layout() {
  return (
    <div>
      <SyncIndicator />
      {/* Tu contenido */}
    </div>
  );
}
\\\

## 📊 DATOS DISPONIBLES

Desde useAgents():

- **agents**: Array de TODOS los agentes (activos + inactivos)
- **activeAgents**: Array solo agentes activos
- **inactiveAgents**: Array solo agentes inactivos
- **totalAgents**: Número total (239)
- **activeCount**: Cantidad de activos (70)
- **inactiveCount**: Cantidad de inactivos (169)
- **loading**: boolean (true mientras carga)
- **error**: string | null (si hay error)
- **refresh()**: Función para actualizar manualmente

## 🔄 ACTUALIZACIÓN AUTOMÁTICA

El hook se actualiza automáticamente cada 30 segundos.
Si quieres cambiar este tiempo, edita:

\pp/hooks/useAgents.ts\ - línea del \setInterval\

## 🚀 ESO ES TODO

Tu backend genera JSON → Tu frontend lo carga automáticamente → ¡Listo!

No hay más pasos. Todo está sincronizado.
