"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Filter, Save, Trash2, Search, Download, Upload,
  ChevronRight, BarChart3, Target, Zap, Clock, HelpCircle,
  CheckCircle, AlertTriangle, Loader2, Copy, Edit2, X, RefreshCw,
  TrendingUp, AlertCircle, Info
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "${process.env.NEXT_PUBLIC_API_BASE_URL}";
const STORAGE_KEY = "nadakki_segments_v2";
const CACHE_TTL = 5 * 60 * 1000;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES & INTERFACES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ConditionGroup {
  id: string;
  type: "AND" | "OR";
  conditions: Condition[];
}

interface Segment {
  id: string;
  name: string;
  description: string;
  conditionGroups: ConditionGroup[];
  size: number;
  predictedConversion: number;
  created_at: string;
  updated_at: string;
  status: "active" | "draft" | "archived";
  stats: {
    campaigns_used: number;
    avg_open_rate: number;
    avg_click_rate: number;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONSTANTS & CONFIG
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const FIELD_OPTIONS = [
  { id: "activity_days", label: "Dias desde ultima actividad", type: "number", weight: 0.2, tooltip: "Dias desde la ultima interaccion con la plataforma" },
  { id: "total_purchases", label: "Total de compras", type: "number", weight: 0.3, tooltip: "Numero total de compras realizadas" },
  { id: "email_opens", label: "Emails abiertos (30d)", type: "number", weight: 0.18, tooltip: "Emails abiertos en los ultimos 30 dias" },
  { id: "lead_score", label: "Lead Score", type: "number", weight: 0.25, tooltip: "Puntuacion basada en actividad, engagement y conversiones (0-100)" },
  { id: "plan_type", label: "Tipo de plan", type: "select", weight: 0.4, options: ["free", "starter", "pro", "enterprise"], tooltip: "Nivel de suscripcion del usuario" },
  { id: "signup_date", label: "Fecha de registro", type: "date", weight: 0.22, tooltip: "Fecha en que se registro el usuario" },
  { id: "country", label: "Pais", type: "text", weight: 0.15, tooltip: "Pais de origen del usuario" },
  { id: "industry", label: "Industria", type: "text", weight: 0.2, tooltip: "Sector o industria de la empresa" },
  { id: "company_size", label: "Tamano de empresa", type: "select", weight: 0.25, options: ["1-10", "11-50", "51-200", "201-500", "500+"], tooltip: "Numero de empleados" },
  { id: "engagement_level", label: "Nivel de engagement", type: "select", weight: 0.35, options: ["cold", "warm", "hot"], tooltip: "Nivel de interaccion con la plataforma" },
  { id: "lifetime_value", label: "Valor de vida (LTV)", type: "number", weight: 0.28, tooltip: "Valor total generado por el cliente" },
  { id: "churn_risk", label: "Riesgo de churn", type: "select", weight: 0.32, options: ["low", "medium", "high"], tooltip: "Probabilidad de abandono" },
];

const OPERATORS: Record<string, Array<{ id: string; label: string }>> = {
  number: [
    { id: "eq", label: "igual a" },
    { id: "gt", label: "mayor que" },
    { id: "lt", label: "menor que" },
    { id: "gte", label: "mayor o igual" },
    { id: "lte", label: "menor o igual" },
    { id: "between", label: "entre" },
  ],
  text: [
    { id: "eq", label: "es igual a" },
    { id: "neq", label: "no es igual a" },
    { id: "contains", label: "contiene" },
    { id: "not_contains", label: "no contiene" },
    { id: "starts", label: "empieza con" },
    { id: "ends", label: "termina con" },
  ],
  select: [
    { id: "eq", label: "es" },
    { id: "neq", label: "no es" },
    { id: "in", label: "es uno de" },
    { id: "not_in", label: "no es ninguno de" },
  ],
  date: [
    { id: "before", label: "antes de" },
    { id: "after", label: "despues de" },
    { id: "between", label: "entre" },
    { id: "last_days", label: "ultimos X dias" },
    { id: "exactly", label: "exactamente" },
  ],
};

const PRESET_SEGMENTS = [
  { 
    name: "Usuarios Activos", 
    desc: "Actividad en ultimos 30 dias", 
    size: 8230, 
    conversion: 0.12,
    groups: [{ id: "g1", type: "AND" as const, conditions: [{ id: "c1", field: "activity_days", operator: "lte", value: "30" }] }]
  },
  { 
    name: "Leads Calientes", 
    desc: "Lead score > 70 y engagement hot", 
    size: 1850, 
    conversion: 0.28,
    groups: [{ id: "g1", type: "AND" as const, conditions: [
      { id: "c1", field: "lead_score", operator: "gte", value: "70" },
      { id: "c2", field: "engagement_level", operator: "eq", value: "hot" }
    ]}]
  },
  { 
    name: "En Riesgo de Churn", 
    desc: "Alto riesgo + inactivos 45+ dias", 
    size: 1240, 
    conversion: 0.05,
    groups: [{ id: "g1", type: "AND" as const, conditions: [
      { id: "c1", field: "churn_risk", operator: "eq", value: "high" },
      { id: "c2", field: "activity_days", operator: "gte", value: "45" }
    ]}]
  },
  { 
    name: "Clientes Premium", 
    desc: "Plan Pro o Enterprise", 
    size: 890, 
    conversion: 0.18,
    groups: [{ id: "g1", type: "OR" as const, conditions: [
      { id: "c1", field: "plan_type", operator: "eq", value: "pro" },
      { id: "c2", field: "plan_type", operator: "eq", value: "enterprise" }
    ]}]
  },
  { 
    name: "Alto Valor (LTV)", 
    desc: "LTV > $1000", 
    size: 2100, 
    conversion: 0.22,
    groups: [{ id: "g1", type: "AND" as const, conditions: [{ id: "c1", field: "lifetime_value", operator: "gte", value: "1000" }] }]
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// UTILITY FUNCTIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const generateId = () => Math.random().toString(36).substr(2, 9);

const getFieldWeight = (field: string): number => {
  const fieldConfig = FIELD_OPTIONS.find(f => f.id === field);
  return fieldConfig?.weight || 0.2;
};

const getOperatorWeight = (operator: string): number => {
  const weights: Record<string, number> = {
    eq: 0.5, neq: 0.5, gt: 0.4, lt: 0.4, gte: 0.35, lte: 0.35,
    between: 0.3, contains: 0.45, in: 0.4, not_in: 0.4,
    before: 0.35, after: 0.35, last_days: 0.3, starts: 0.4, ends: 0.4
  };
  return weights[operator] || 0.4;
};

const calculateSegmentSize = (groups: ConditionGroup[]): number => {
  const totalUsers = 12450;
  let estimated = totalUsers;
  
  groups.forEach(group => {
    let groupReduction = 0;
    
    group.conditions.forEach(cond => {
      const fieldWeight = getFieldWeight(cond.field);
      const operatorWeight = getOperatorWeight(cond.operator);
      const conditionReduction = fieldWeight * operatorWeight;
      
      if (group.type === "AND") {
        groupReduction += conditionReduction;
      } else {
        groupReduction = Math.max(groupReduction, conditionReduction * 0.7);
      }
    });
    
    estimated *= (1 - Math.min(groupReduction, 0.85));
  });
  
  return Math.max(Math.floor(estimated), 50);
};

const calculatePredictedConversion = (groups: ConditionGroup[]): number => {
  let baseConversion = 0.08;
  
  groups.forEach(group => {
    group.conditions.forEach(cond => {
      if (cond.field === "lead_score" && cond.operator === "gte") {
        baseConversion += parseFloat(cond.value) * 0.002;
      }
      if (cond.field === "engagement_level" && cond.value === "hot") {
        baseConversion += 0.15;
      }
      if (cond.field === "churn_risk" && cond.value === "high") {
        baseConversion -= 0.05;
      }
      if (cond.field === "activity_days" && cond.operator === "lte") {
        const days = parseInt(cond.value);
        if (days <= 7) baseConversion += 0.08;
        else if (days <= 30) baseConversion += 0.04;
      }
    });
  });
  
  return Math.min(Math.max(baseConversion, 0.02), 0.45);
};

const validateSegment = (name: string, groups: ConditionGroup[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!name.trim()) errors.push("Nombre del segmento requerido");
  if (name.trim().length < 3) errors.push("Nombre muy corto (minimo 3 caracteres)");
  if (name.trim().length > 50) errors.push("Nombre muy largo (maximo 50 caracteres)");
  
  if (groups.length === 0) errors.push("Agrega al menos un grupo de condiciones");
  
  let totalConditions = 0;
  groups.forEach((group, gi) => {
    if (group.conditions.length === 0) {
      errors.push(`Grupo ${gi + 1}: agrega al menos una condicion`);
    }
    
    group.conditions.forEach((cond, ci) => {
      totalConditions++;
      if (!cond.value.trim()) {
        errors.push(`Grupo ${gi + 1}, Condicion ${ci + 1}: valor requerido`);
      }
      if (cond.operator === "between" && !cond.value.includes(",")) {
        errors.push(`Grupo ${gi + 1}, Condicion ${ci + 1}: formato 'entre' necesita dos valores separados por coma`);
      }
    });
  });
  
  if (totalConditions > 15) {
    errors.push("Demasiadas condiciones (maximo 15). Considera simplificar el segmento.");
  }
  
  return { valid: errors.length === 0, errors };
};

const generateSQLPreview = (groups: ConditionGroup[]): string => {
  if (groups.length === 0) return "SELECT * FROM users";
  
  const groupsSQL = groups?.map(group => {
    const conditionsSQL = group?.conditions?.map(cond => {
      const op = cond.operator === "eq" ? "=" : 
                 cond.operator === "neq" ? "!=" :
                 cond.operator === "gt" ? ">" :
                 cond.operator === "lt" ? "<" :
                 cond.operator === "gte" ? ">=" :
                 cond.operator === "lte" ? "<=" :
                 cond.operator === "contains" ? "LIKE" :
                 cond.operator === "in" ? "IN" : cond.operator.toUpperCase();
      
      const val = cond.operator === "contains" ? `'%${cond.value}%'` :
                  cond.operator === "in" ? `(${cond.value.split(",").map(v => `'${v.trim()}'`).join(", ")})` :
                  isNaN(Number(cond.value)) ? `'${cond.value}'` : cond.value;
      
      return `${cond.field} ${op} ${val}`;
    }).join(` ${group.type} `);
    
    return `(${conditionsSQL})`;
  }).join(" AND ");
  
  return `SELECT * FROM users WHERE ${groupsSQL}`;
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function SegmentsPage() {
  // State
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([]);
  const [segmentName, setSegmentName] = useState("");
  const [segmentDesc, setSegmentDesc] = useState("");
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [predictedConversion, setPredictedConversion] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSQL, setShowSQL] = useState(false);

  // Notifications
  const addNotification = useCallback((type: Notification["type"], message: string) => {
    const id = generateId();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSegments(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Error parsing saved segments:", e);
      }
    }
    fetchSegments();
  }, []);

  // Save to localStorage when segments change
  useEffect(() => {
    if (segments.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
    }
  }, [segments]);

  // Auto-calculate when conditions change
  useEffect(() => {
    if (conditionGroups.length > 0 && conditionGroups.some(g => g.conditions.length > 0)) {
      const timer = setTimeout(() => {
        setEstimatedSize(calculateSegmentSize(conditionGroups));
        setPredictedConversion(calculatePredictedConversion(conditionGroups));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setEstimatedSize(null);
      setPredictedConversion(null);
    }
  }, [conditionGroups]);

  // Validate on change
  useEffect(() => {
    if (showBuilder) {
      const timer = setTimeout(() => {
        const { errors } = validateSegment(segmentName, conditionGroups);
        setValidationErrors(errors);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [segmentName, conditionGroups, showBuilder]);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL + "/api/segments?tenant_id=credicefi");
      if (res.ok) {
        const data = await res.json();
        if (data.segments && data.segments.length > 0) {
          setSegments(data.segments);
        } else {
          setSegments(getDefaultSegments());
        }
      } else {
        throw new Error("API error");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setSegments(getDefaultSegments());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSegments = (): Segment[] => PRESET_SEGMENTS?.map((s, i) => ({
    id: "seg-" + (i + 1),
    name: s.name,
    description: s.desc,
    conditionGroups: s.groups,
    size: s.size,
    predictedConversion: s.conversion,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    status: "active",
    stats: { campaigns_used: Math.floor(Math.random() * 10) + 1, avg_open_rate: 0.25 + Math.random() * 0.2, avg_click_rate: 0.08 + Math.random() * 0.1 }
  }));

  // Condition management
  const addConditionGroup = () => {
    setConditionGroups([...conditionGroups, { id: generateId(), type: "AND", conditions: [] }]);
  };

  const removeConditionGroup = (groupId: string) => {
    setConditionGroups(conditionGroups.filter(g => g.id !== groupId));
  };

  const updateGroupType = (groupId: string, type: "AND" | "OR") => {
    setConditionGroups(conditionGroups?.map(g => g.id === groupId ? { ...g, type } : g));
  };

  const addCondition = (groupId: string) => {
    setConditionGroups(conditionGroups?.map(g => 
      g.id === groupId 
        ? { ...g, conditions: [...g.conditions, { id: generateId(), field: "activity_days", operator: "lte", value: "" }] }
        : g
    ));
  };

  const updateCondition = (groupId: string, condId: string, updates: Partial<Condition>) => {
    setConditionGroups(conditionGroups?.map(g => 
      g.id === groupId 
        ? { ...g, conditions: g?.conditions?.map(c => c.id === condId ? { ...c, ...updates } : c) }
        : g
    ));
  };

  const removeCondition = (groupId: string, condId: string) => {
    setConditionGroups(conditionGroups?.map(g => 
      g.id === groupId 
        ? { ...g, conditions: g.conditions.filter(c => c.id !== condId) }
        : g
    ));
  };

  // Save segment
  const saveSegment = async () => {
    const validation = validateSegment(segmentName, conditionGroups);
    if (!validation.valid) {
      addNotification("error", validation.errors[0]);
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    
    const newSegment: Segment = {
      id: editingSegment?.id || "seg-" + generateId(),
      name: segmentName.trim(),
      description: segmentDesc.trim(),
      conditionGroups,
      size: estimatedSize || calculateSegmentSize(conditionGroups),
      predictedConversion: predictedConversion || calculatePredictedConversion(conditionGroups),
      created_at: editingSegment?.created_at || now,
      updated_at: now,
      status: "active",
      stats: editingSegment?.stats || { campaigns_used: 0, avg_open_rate: 0, avg_click_rate: 0 }
    };

    try {
      await fetch(API_URL + "/api/segments", {
        method: editingSegment ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSegment, tenant_id: "credicefi" })
      });
    } catch {}

    if (editingSegment) {
      setSegments(segments?.map(s => s.id === editingSegment.id ? newSegment : s));
      addNotification("success", "Segmento actualizado correctamente");
    } else {
      setSegments([newSegment, ...segments]);
      addNotification("success", "Segmento creado correctamente");
    }

    resetBuilder();
    setSaving(false);
  };

  const resetBuilder = () => {
    setShowBuilder(false);
    setEditingSegment(null);
    setConditionGroups([]);
    setSegmentName("");
    setSegmentDesc("");
    setEstimatedSize(null);
    setPredictedConversion(null);
    setValidationErrors([]);
    setShowSQL(false);
  };

  const editSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setSegmentName(segment.name);
    setSegmentDesc(segment.description);
    setConditionGroups(segment.conditionGroups);
    setEstimatedSize(segment.size);
    setPredictedConversion(segment.predictedConversion);
    setShowBuilder(true);
  };

  const duplicateSegment = (segment: Segment) => {
    const newSegment: Segment = {
      ...segment,
      id: "seg-" + generateId(),
      name: segment.name + " (copia)",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stats: { campaigns_used: 0, avg_open_rate: 0, avg_click_rate: 0 }
    };
    setSegments([newSegment, ...segments]);
    addNotification("success", "Segmento duplicado");
  };

  const deleteSegment = async (id: string) => {
    if (!confirm("Eliminar este segmento? Esta accion no se puede deshacer.")) return;
    
    try {
      await fetch(API_URL + "/api/segments/" + id + "?tenant_id=credicefi", { method: "DELETE" });
    } catch {}
    
    setSegments(segments.filter(s => s.id !== id));
    addNotification("success", "Segmento eliminado");
  };

  const usePreset = (preset: typeof PRESET_SEGMENTS[0]) => {
    setSegmentName(preset.name);
    setSegmentDesc(preset.desc);
    setConditionGroups(preset.groups?.map(g => ({ ...g, id: generateId(), conditions: g?.conditions?.map(c => ({ ...c, id: generateId() })) })));
  };

  // Export/Import
  const exportSegments = () => {
    const dataStr = JSON.stringify(segments, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = `nadakki-segments-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification("success", "Segmentos exportados");
  };

  const importSegments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setSegments(imported);
          addNotification("success", `${imported.length} segmentos importados`);
        }
      } catch {
        addNotification("error", "Error importando segmentos");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Filtered segments
  const filteredSegments = useMemo(() => {
    if (!searchQuery) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.description.toLowerCase().includes(q)
    );
  }, [segments, searchQuery]);

  // Stats
  const totalUsers = 12450;
  const activeSegments = segments.filter(s => s.status === "active").length;
  const avgConversion = segments.length > 0 
    ? (segments.reduce((acc, s) => acc + s.predictedConversion, 0) / segments.length * 100).toFixed(1)
    : "0";

  return (
    <div className="ndk-page ndk-fade-in">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications?.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
              className={"px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 " +
                (n.type === "success" ? "bg-green-500" : n.type === "error" ? "bg-red-500" : n.type === "warning" ? "bg-yellow-500" : "bg-blue-500")}>
              {n.type === "success" && <CheckCircle className="w-4 h-4" />}
              {n.type === "error" && <AlertCircle className="w-4 h-4" />}
              {n.type === "warning" && <AlertTriangle className="w-4 h-4" />}
              {n.type === "info" && <Info className="w-4 h-4" />}
              <span className="text-white text-sm font-medium">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label={segments.length + " Segmentos"} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Segmentacion Avanzada</h1>
              <p className="text-gray-400">Crea segmentos dinamicos con prediccion de conversion</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Importar</span>
              <input type="file" accept=".json" onChange={importSegments} className="hidden" />
            </label>
            <button onClick={exportSegments} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">
              <Download className="w-4 h-4" />
              <span className="text-sm">Exportar</span>
            </button>
            <button onClick={() => { resetBuilder(); setShowBuilder(true); addConditionGroup(); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium transition-colors">
              <Plus className="w-5 h-5" /> Nuevo Segmento
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={totalUsers.toLocaleString()} label="Total Usuarios" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={activeSegments.toString()} label="Segmentos Activos" icon={<Target className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={avgConversion + "%"} label="Conversion Promedio" icon={<TrendingUp className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={segments.reduce((acc, s) => acc + s.stats.campaigns_used, 0).toString()} label="Campanas Usadas" icon={<BarChart3 className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      {/* Builder */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
            <GlassCard className="p-6 border-green-500/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">{editingSegment ? "Editar" : "Nuevo"} Segmento</h3>
                <button onClick={resetBuilder} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium text-sm">Corrige los siguientes errores:</p>
                      <ul className="text-red-300 text-xs mt-1 space-y-1">
                        {validationErrors.slice(0, 3).map((err, i) => <li key={i}>â€¢ {err}</li>)}
                        {validationErrors.length > 3 && <li>â€¢ +{validationErrors.length - 3} mas...</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Name & Description */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre del Segmento *</label>
                  <input type="text" value={segmentName} onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="Ej: Usuarios Premium Activos"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Descripcion</label>
                  <input type="text" value={segmentDesc} onChange={(e) => setSegmentDesc(e.target.value)}
                    placeholder="Descripcion breve del segmento"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:outline-none" />
                </div>
              </div>

              {/* Presets */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400">Plantillas rapidas</label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_SEGMENTS?.map((p, i) => (
                    <button key={i} onClick={() => usePreset(p)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-green-500/20 hover:text-green-400 border border-white/10 rounded-lg text-gray-400 transition-colors">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Groups */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-3 block">Grupos de Condiciones</label>
                
                <div className="space-y-4">
                  {conditionGroups?.map((group, gi) => (
                    <div key={group.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {gi > 0 && <span className="text-purple-400 font-bold text-sm mr-2">AND</span>}
                          <span className="text-white font-medium text-sm">Grupo {gi + 1}</span>
                          <select value={group.type} onChange={(e) => updateGroupType(group.id, e.target.value as "AND" | "OR")}
                            className="ml-2 px-2 py-1 bg-white/10 border border-white/10 rounded text-xs text-white">
                            <option value="AND">Todas las condiciones (AND)</option>
                            <option value="OR">Cualquier condicion (OR)</option>
                          </select>
                        </div>
                        <button onClick={() => removeConditionGroup(group.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {group?.conditions?.map((cond, ci) => {
                          const field = FIELD_OPTIONS.find(f => f.id === cond.field);
                          const operators = OPERATORS[field?.type || "text"] || OPERATORS.text;
                          
                          return (
                            <div key={cond.id} className="flex items-center gap-2">
                              {ci > 0 && (
                                <span className={"text-xs font-medium w-8 " + (group.type === "AND" ? "text-green-400" : "text-yellow-400")}>
                                  {group.type}
                                </span>
                              )}
                              {ci === 0 && <span className="w-8" />}
                              
                              <div className="relative group/tooltip flex-1">
                                <select value={cond.field} onChange={(e) => updateCondition(group.id, cond.id, { field: e.target.value, value: "" })}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                                  {FIELD_OPTIONS?.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </select>
                                {field?.tooltip && (
                                  <div className="absolute invisible group-hover/tooltip:visible bottom-full mb-2 left-0 w-64 p-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 z-50">
                                    {field.tooltip}
                                  </div>
                                )}
                              </div>

                              <select value={cond.operator} onChange={(e) => updateCondition(group.id, cond.id, { operator: e.target.value })}
                                className="w-36 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                                {operators?.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                              </select>

                              {field?.type === "select" && field.options ? (
                                <select value={cond.value} onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                                  <option value="">Seleccionar...</option>
                                  {field?.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input 
                                  type={field?.type === "number" ? "number" : field?.type === "date" ? "date" : "text"} 
                                  value={cond.value}
                                  onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                                  placeholder={cond.operator === "between" ? "min,max" : "Valor"}
                                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" />
                              )}

                              <button onClick={() => removeCondition(group.id, cond.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button onClick={() => addCondition(group.id)}
                        className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 text-xs">
                        <Plus className="w-3 h-3" /> Agregar condicion
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={addConditionGroup}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 text-sm">
                  <Plus className="w-4 h-4" /> Agregar grupo de condiciones
                </button>
              </div>

              {/* SQL Preview */}
              {conditionGroups.length > 0 && conditionGroups.some(g => g.conditions.length > 0) && (
                <div className="mb-4">
                  <button onClick={() => setShowSQL(!showSQL)} className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1">
                    <ChevronRight className={"w-3 h-3 transition-transform " + (showSQL ? "rotate-90" : "")} />
                    {showSQL ? "Ocultar" : "Ver"} consulta SQL
                  </button>
                  {showSQL && (
                    <pre className="mt-2 p-3 bg-black/30 rounded-lg text-xs text-green-400 overflow-x-auto">
                      {generateSQLPreview(conditionGroups)}
                    </pre>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  {estimatedSize !== null && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-bold">{estimatedSize.toLocaleString()}</span>
                        <span className="text-gray-400 text-sm">usuarios</span>
                      </div>
                      {predictedConversion !== null && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 font-bold">{(predictedConversion * 100).toFixed(1)}%</span>
                          <span className="text-gray-400 text-sm">conversion estimada</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={resetBuilder} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">
                    Cancelar
                  </button>
                  <button onClick={saveSegment} disabled={saving || validationErrors.length > 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingSegment ? "Actualizar" : "Guardar"} Segmento
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar segmentos..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:border-green-500 focus:outline-none" />
        </div>
        <button onClick={fetchSegments} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
          <RefreshCw className={"w-5 h-5 " + (loading ? "animate-spin" : "")} />
        </button>
      </div>

      {/* Segments Grid */}
      <h2 className="text-xl font-bold text-white mb-4">Segmentos ({filteredSegments.length})</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : filteredSegments.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay segmentos que coincidan con tu busqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredSegments?.map((segment, i) => (
            <motion.div key={segment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard className="p-5 group hover:border-green-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">{segment.name}</h3>
                      {new Date(segment.created_at) > new Date(Date.now() - 86400000) && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">NUEVO</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{segment.description}</p>
                  </div>
                  <span className={"px-2 py-1 text-xs rounded-full " + 
                    (segment.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400")}>
                    {segment.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-1 text-blue-400">
                      <Users className="w-3 h-3" />
                      <span className="font-bold text-sm">{segment.size.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">usuarios</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-1 text-purple-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-bold text-sm">{(segment.predictedConversion * 100).toFixed(1)}%</span>
                    </div>
                    <span className="text-[10px] text-gray-500">conversion</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Filter className="w-3 h-3" />
                      <span className="font-bold text-sm">{segment.conditionGroups.reduce((acc, g) => acc + g.conditions.length, 0)}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">condiciones</span>
                  </div>
                </div>

                {segment.stats.campaigns_used > 0 && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>Usado en {segment.stats.campaigns_used} campanas</span>
                    <span>Open: {(segment.stats.avg_open_rate * 100).toFixed(0)}%</span>
                    <span>Click: {(segment.stats.avg_click_rate * 100).toFixed(0)}%</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(segment.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => editSegment(segment)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => duplicateSegment(segment)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Duplicar">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSegment(segment.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}


