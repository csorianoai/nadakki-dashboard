"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Save, Download, Upload, Trash2, Plus, Settings, X,
  Mail, MessageSquare, Bell, Clock, GitBranch, Zap, Flag, Globe,
  Filter, Users, Target, BarChart3, Eye, Copy, RefreshCw, Loader2,
  ChevronRight, GripVertical, ArrowRight, Sparkles, Layers
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type NodeType = "trigger" | "email" | "sms" | "push" | "wait" | "condition" | "split" | "action" | "webhook" | "end";

interface JourneyNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface Journey {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "completed";
  nodes: JourneyNode[];
  connections: Connection[];
  stats: { contacts: number; completed: number; conversionRate: number };
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const NODE_TYPES: Record<NodeType, { icon: any; color: string; label: string; desc: string }> = {
  trigger: { icon: Flag, color: "#22c55e", label: "Trigger", desc: "Inicio del journey" },
  email: { icon: Mail, color: "#3b82f6", label: "Email", desc: "Enviar correo" },
  sms: { icon: MessageSquare, color: "#8b5cf6", label: "SMS", desc: "Enviar mensaje" },
  push: { icon: Bell, color: "#f59e0b", label: "Push", desc: "Notificación push" },
  wait: { icon: Clock, color: "#6b7280", label: "Esperar", desc: "Delay temporal" },
  condition: { icon: GitBranch, color: "#ec4899", label: "Condición", desc: "Si/Entonces" },
  split: { icon: Filter, color: "#14b8a6", label: "A/B Split", desc: "Dividir tráfico" },
  action: { icon: Zap, color: "#f97316", label: "Acción", desc: "Ejecutar acción" },
  webhook: { icon: Globe, color: "#06b6d4", label: "Webhook", desc: "Llamar API" },
  end: { icon: Flag, color: "#ef4444", label: "Fin", desc: "Terminar journey" },
};

const JOURNEY_TEMPLATES = [
  { id: "onboarding", name: "Onboarding", nodes: 5, desc: "Secuencia de bienvenida" },
  { id: "winback", name: "Win-back", nodes: 4, desc: "Recuperar usuarios inactivos" },
  { id: "promotion", name: "Promoción", nodes: 3, desc: "Campaña promocional" },
  { id: "nurturing", name: "Nurturing", nodes: 6, desc: "Educación de leads" },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// ═══════════════════════════════════════════════════════════════
// INITIAL DATA
// ═══════════════════════════════════════════════════════════════
const INITIAL_NODES: JourneyNode[] = [
  { id: "node-1", type: "trigger", title: "Usuario se registra", description: "Nuevo registro en plataforma", config: { event: "user.signup" }, position: { x: 100, y: 200 } },
  { id: "node-2", type: "email", title: "Email Bienvenida", description: "Enviar email de bienvenida", config: { template: "welcome", subject: "Bienvenido!" }, position: { x: 350, y: 200 } },
  { id: "node-3", type: "wait", title: "Esperar 2 días", description: "Pausa de 48 horas", config: { duration: 2, unit: "days" }, position: { x: 600, y: 200 } },
  { id: "node-4", type: "condition", title: "¿Abrió email?", description: "Verificar apertura", config: { field: "email_opened", operator: "equals", value: true }, position: { x: 850, y: 200 } },
  { id: "node-5", type: "email", title: "Email Seguimiento", description: "Contenido adicional", config: { template: "followup" }, position: { x: 1100, y: 100 } },
  { id: "node-6", type: "sms", title: "SMS Recordatorio", description: "Recordar por SMS", config: { message: "No olvides completar tu perfil" }, position: { x: 1100, y: 300 } },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "conn-1", from: "node-1", to: "node-2" },
  { id: "conn-2", from: "node-2", to: "node-3" },
  { id: "conn-3", from: "node-3", to: "node-4" },
  { id: "conn-4", from: "node-4", to: "node-5", label: "Sí" },
  { id: "conn-5", from: "node-4", to: "node-6", label: "No" },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function JourneyBuilderPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<JourneyNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [journeyName, setJourneyName] = useState("Customer Onboarding Journey");
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ from: string; startPos: { x: number; y: number } } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showConfig, setShowConfig] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Stats
  const stats = { contacts: 1250, completed: 856, conversionRate: 68.5 };

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom;
    setMousePos({ x, y });

    if (draggingNode) {
      setNodes(nodes.map(n => n.id === draggingNode ? { ...n, position: { x: x - 96, y: y - 40 } } : n));
    }
  }, [draggingNode, nodes, canvasOffset, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingNode(null);
    if (connecting) setConnecting(null);
  }, [connecting]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
  }, []);

  const handleStartConnect = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setConnecting({ from: nodeId, startPos: { x: node.position.x + 192, y: node.position.y + 40 } });
    }
  }, [nodes]);

  const handleNodeClick = useCallback((node: JourneyNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connecting) {
      if (connecting.from !== node.id) {
        const newConnection: Connection = { id: "conn-" + generateId(), from: connecting.from, to: node.id };
        setConnections([...connections, newConnection]);
      }
      setConnecting(null);
    } else {
      setSelectedNode(node);
      setShowConfig(true);
    }
  }, [connecting, connections]);

  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null);
    setShowConfig(false);
    setConnecting(null);
  }, []);

  const addNode = useCallback((type: NodeType) => {
    const nodeConfig = NODE_TYPES[type];
    const newNode: JourneyNode = {
      id: "node-" + generateId(),
      type,
      title: nodeConfig.label,
      description: nodeConfig.desc,
      config: {},
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 200 }
    };
    setNodes([...nodes, newNode]);
  }, [nodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    setShowConfig(false);
  }, [nodes, connections]);

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n));
  }, [nodes]);

  const saveJourney = useCallback(async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    localStorage.setItem("nadakki_journey_" + generateId(), JSON.stringify({ name: journeyName, nodes, connections }));
    setSaving(false);
    alert("Journey guardado!");
  }, [journeyName, nodes, connections]);

  const runJourney = useCallback(async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 2000));
    setRunning(false);
    alert("Journey activado! Los contactos comenzarán a fluir.");
  }, []);

  const exportJourney = useCallback(() => {
    const data = JSON.stringify({ name: journeyName, nodes, connections }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journey-${Date.now()}.json`;
    a.click();
  }, [journeyName, nodes, connections]);

  const loadTemplate = useCallback((templateId: string) => {
    // En producción cargaría desde API
    setShowTemplates(false);
    alert(`Template "${templateId}" cargado!`);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SVG PATH CALCULATOR
  // ═══════════════════════════════════════════════════════════════
  const getConnectionPath = useCallback((from: JourneyNode, to: JourneyNode) => {
    const startX = from.position.x + 192;
    const startY = from.position.y + 40;
    const endX = to.position.x;
    const endY = to.position.y + 40;
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0a0f1c]">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Journey Builder" size="lg" />
      </NavigationBar>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - Node Palette */}
        <div className="w-64 bg-[#0d1117] border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Componentes
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {Object.entries(NODE_TYPES).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => addNode(type as NodeType)}
                  className="w-full p-3 text-left rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: config.color + "20" }}>
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{config.label}</div>
                      <div className="text-xs text-gray-500">{config.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Templates Button */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Cargar Template
            </button>
          </div>
        </div>

        {/* MAIN CANVAS */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-[#0d1117]/50">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                className="text-lg font-bold bg-transparent border-none text-white focus:outline-none w-80"
              />
              <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Borrador</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportJourney} className="p-2 hover:bg-white/10 rounded-lg text-gray-400" title="Exportar">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={saveJourney} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={runJourney} disabled={running}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium disabled:opacity-50">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? "Activando..." : "Activar"}
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden cursor-crosshair"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onClick={handleCanvasClick}
            style={{ background: "radial-gradient(circle at center, #1a1f2e 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          >
            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
                </marker>
              </defs>
              
              {connections.map(conn => {
                const fromNode = nodes.find(n => n.id === conn.from);
                const toNode = nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;
                
                return (
                  <g key={conn.id}>
                    <path
                      d={getConnectionPath(fromNode, toNode)}
                      fill="none"
                      stroke="#4b5563"
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                    {conn.label && (
                      <text
                        x={(fromNode.position.x + 192 + toNode.position.x) / 2}
                        y={(fromNode.position.y + toNode.position.y) / 2 + 30}
                        fill="#9ca3af"
                        fontSize={12}
                        textAnchor="middle"
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Connecting line */}
              {connecting && (
                <line
                  x1={connecting.startPos.x}
                  y1={connecting.startPos.y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const config = NODE_TYPES[node.type];
              const Icon = config.icon;
              const isSelected = selectedNode?.id === node.id;
              
              return (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`absolute w-48 rounded-xl border-2 transition-all cursor-move select-none ${
                    isSelected ? "border-white shadow-lg shadow-white/20 z-20" : "border-white/20 hover:border-white/40 z-10"
                  }`}
                  style={{ left: node.position.x, top: node.position.y, backgroundColor: "#1f2937" }}
                  onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                  onClick={(e) => handleNodeClick(node, e)}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 p-3 rounded-t-xl" style={{ backgroundColor: config.color + "20" }}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                    <span className="text-xs font-medium text-white flex-1">{config.label}</span>
                    {node.type !== "trigger" && (
                      <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1 hover:bg-white/20 rounded">
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <p className="text-sm text-white font-medium truncate">{node.title}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{node.description}</p>
                  </div>
                  
                  {/* Connect Button */}
                  {node.type !== "end" && (
                    <div className="px-3 pb-3">
                      <button
                        onClick={(e) => handleStartConnect(node.id, e)}
                        className="w-full py-1.5 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded flex items-center justify-center gap-1"
                      >
                        Conectar <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Connection Points */}
                  {node.type !== "trigger" && (
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/20 border-2 border-white/40 rounded-full" />
                  )}
                  {node.type !== "end" && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500/50 border-2 border-green-500 rounded-full" />
                  )}
                </motion.div>
              );
            })}

            {/* Stats Panel */}
            <div className="absolute top-4 right-4 flex gap-3">
              <GlassCard className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-bold">{stats.contacts.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm">contactos</span>
                </div>
              </GlassCard>
              <GlassCard className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-white font-bold">{stats.conversionRate}%</span>
                  <span className="text-gray-500 text-sm">conversión</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Node Config */}
        <AnimatePresence>
          {showConfig && selectedNode && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 bg-[#0d1117] border-l border-white/10 flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white">Configurar Nodo</h3>
                <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Título</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, title: e.target.value } : n))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Descripción</label>
                  <textarea
                    value={selectedNode.description}
                    onChange={(e) => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, description: e.target.value } : n))}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
                  />
                </div>
                
                {/* Type-specific config */}
                {selectedNode.type === "email" && (
                  <>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Template</label>
                      <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option>Bienvenida</option>
                        <option>Promocional</option>
                        <option>Recordatorio</option>
                        <option>Personalizado</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Asunto</label>
                      <input
                        type="text"
                        placeholder="Asunto del email..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </>
                )}
                
                {selectedNode.type === "wait" && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Duración</label>
                    <div className="flex gap-2">
                      <input type="number" defaultValue={2} min={1} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                      <select className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option>Horas</option>
                        <option>Días</option>
                        <option>Semanas</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {selectedNode.type === "condition" && (
                  <>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Campo</label>
                      <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option>Email abierto</option>
                        <option>Link clickeado</option>
                        <option>Compra realizada</option>
                        <option>Página visitada</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Condición</label>
                      <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option>Es verdadero</option>
                        <option>Es falso</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-4 border-t border-white/10 space-y-2">
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Nodo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Cargar Template</h3>
                <p className="text-gray-400">Selecciona un template para comenzar rápidamente</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {JOURNEY_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className="p-4 border border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-all"
                  >
                    <h4 className="font-bold text-white">{template.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{template.desc}</p>
                    <p className="text-xs text-purple-400 mt-2">{template.nodes} nodos</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
