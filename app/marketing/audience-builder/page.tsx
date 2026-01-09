"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, Plus, Trash2, Users, Filter, Save, Eye, RefreshCw,
  Calendar, DollarSign, ShoppingCart, Mail, MousePointer, Globe,
  Smartphone, Tag, Clock, TrendingUp, Target, Zap, ChevronDown, X
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface RuleGroup {
  id: string;
  connector: "AND" | "OR";
  rules: Rule[];
}

const FIELD_OPTIONS = [
  { category: "User Properties", fields: [
    { id: "email", label: "Email", icon: Mail, type: "string" },
    { id: "created_at", label: "Sign Up Date", icon: Calendar, type: "date" },
    { id: "country", label: "Country", icon: Globe, type: "string" },
    { id: "device", label: "Device Type", icon: Smartphone, type: "select", options: ["mobile", "desktop", "tablet"] },
    { id: "tags", label: "Tags", icon: Tag, type: "tags" },
  ]},
  { category: "Behavior", fields: [
    { id: "last_activity", label: "Last Activity", icon: Clock, type: "date" },
    { id: "sessions", label: "Total Sessions", icon: MousePointer, type: "number" },
    { id: "page_views", label: "Page Views", icon: Eye, type: "number" },
    { id: "events", label: "Events Triggered", icon: Zap, type: "number" },
  ]},
  { category: "Commerce", fields: [
    { id: "total_spend", label: "Total Spend", icon: DollarSign, type: "number" },
    { id: "orders", label: "Total Orders", icon: ShoppingCart, type: "number" },
    { id: "avg_order", label: "Avg Order Value", icon: TrendingUp, type: "number" },
    { id: "last_purchase", label: "Last Purchase", icon: Calendar, type: "date" },
  ]},
  { category: "Engagement", fields: [
    { id: "email_opens", label: "Email Opens", icon: Mail, type: "number" },
    { id: "email_clicks", label: "Email Clicks", icon: MousePointer, type: "number" },
    { id: "push_enabled", label: "Push Enabled", icon: Smartphone, type: "boolean" },
    { id: "engagement_score", label: "Engagement Score", icon: Target, type: "number" },
  ]},
];

const OPERATORS = {
  string: [
    { id: "equals", label: "equals" },
    { id: "not_equals", label: "does not equal" },
    { id: "contains", label: "contains" },
    { id: "starts_with", label: "starts with" },
    { id: "ends_with", label: "ends with" },
  ],
  number: [
    { id: "equals", label: "equals" },
    { id: "not_equals", label: "does not equal" },
    { id: "greater_than", label: "greater than" },
    { id: "less_than", label: "less than" },
    { id: "between", label: "between" },
  ],
  date: [
    { id: "within", label: "within last" },
    { id: "before", label: "before" },
    { id: "after", label: "after" },
    { id: "on", label: "on" },
  ],
  boolean: [
    { id: "is_true", label: "is true" },
    { id: "is_false", label: "is false" },
  ],
  select: [
    { id: "equals", label: "is" },
    { id: "not_equals", label: "is not" },
  ],
};

const DATE_VALUES = ["1 day", "7 days", "14 days", "30 days", "60 days", "90 days"];

export default function AudienceBuilderPage() {
  const [segmentName, setSegmentName] = useState("New Segment");
  const [groups, setGroups] = useState<RuleGroup[]>([
    { id: "g1", connector: "AND", rules: [{ id: "r1", field: "", operator: "", value: "" }] }
  ]);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [loading, setLoading] = useState(false);

  const addGroup = () => {
    setGroups([...groups, { id: `g-${Date.now()}`, connector: "OR", rules: [{ id: `r-${Date.now()}`, field: "", operator: "", value: "" }] }]);
  };

  const addRule = (groupId: string) => {
    setGroups(groups?.map(g => 
      g.id === groupId 
        ? { ...g, rules: [...g.rules, { id: `r-${Date.now()}`, field: "", operator: "", value: "" }] }
        : g
    ));
  };

  const updateRule = (groupId: string, ruleId: string, updates: Partial<Rule>) => {
    setGroups(groups?.map(g => 
      g.id === groupId 
        ? { ...g, rules: g?.rules?.map(r => r.id === ruleId ? { ...r, ...updates } : r) }
        : g
    ));
  };

  const deleteRule = (groupId: string, ruleId: string) => {
    setGroups(groups?.map(g => 
      g.id === groupId 
        ? { ...g, rules: g.rules.filter(r => r.id !== ruleId) }
        : g
    ).filter(g => g.rules.length > 0));
  };

  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const toggleConnector = (groupId: string) => {
    setGroups(groups?.map(g => 
      g.id === groupId ? { ...g, connector: g.connector === "AND" ? "OR" : "AND" } : g
    ));
  };

  const getFieldConfig = (fieldId: string) => {
    for (const category of FIELD_OPTIONS) {
      const field = category.fields.find(f => f.id === fieldId);
      if (field) return field;
    }
    return null;
  };

  const calculateAudience = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const filledRules = groups.flatMap(g => g.rules).filter(r => r.field && r.operator);
    const baseSize = 125000;
    const reduction = Math.min(filledRules.length * 0.15, 0.9);
    setEstimatedSize(Math.floor(baseSize * (1 - reduction)));
    setLoading(false);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/marketing/segments" className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Filter className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <input 
              type="text" 
              value={segmentName} 
              onChange={(e) => setSegmentName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none text-white focus:outline-none" 
            />
            <p className="text-gray-400">Audience Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={calculateAudience} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Calculate
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white">
            <Save className="w-4 h-4" /> Save Segment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Rules Builder */}
        <div className="col-span-2 space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Define Your Audience</h3>
            <p className="text-gray-400 text-sm mb-6">Add rules to filter users based on their properties, behavior, and engagement.</p>

            {groups?.map((group, gIdx) => (
              <div key={group.id} className="mb-6">
                {gIdx > 0 && (
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <button onClick={() => toggleConnector(groups[gIdx - 1].id)}
                      className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                      {groups[gIdx - 1].connector}
                    </button>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                )}
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">Rule Group {gIdx + 1}</span>
                    {groups.length > 1 && (
                      <button onClick={() => deleteGroup(group.id)} className="text-red-400 hover:text-red-300 text-sm">
                        Remove Group
                      </button>
                    )}
                  </div>

                  {group?.rules?.map((rule, rIdx) => {
                    const fieldConfig = getFieldConfig(rule.field);
                    const operators = fieldConfig ? OPERATORS[fieldConfig.type as keyof typeof OPERATORS] || OPERATORS.string : [];
                    
                    return (
                      <div key={rule.id}>
                        {rIdx > 0 && (
                          <div className="flex items-center gap-2 my-2 pl-4">
                            <button onClick={() => toggleConnector(group.id)}
                              className="px-2 py-0.5 bg-white/10 text-gray-400 rounded text-xs">
                              {group.connector}
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          {/* Field Selector */}
                          <select
                            value={rule.field}
                            onChange={(e) => updateRule(group.id, rule.id, { field: e.target.value, operator: "", value: "" })}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          >
                            <option value="">Select field...</option>
                            {FIELD_OPTIONS?.map(cat => (
                              <optgroup key={cat.category} label={cat.category}>
                                {cat?.fields?.map(f => (
                                  <option key={f.id} value={f.id}>{f.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>

                          {/* Operator Selector */}
                          <select
                            value={rule.operator}
                            onChange={(e) => updateRule(group.id, rule.id, { operator: e.target.value })}
                            disabled={!rule.field}
                            className="w-40 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                          >
                            <option value="">Select...</option>
                            {operators?.map(op => (
                              <option key={op.id} value={op.id}>{op.label}</option>
                            ))}
                          </select>

                          {/* Value Input */}
                          {fieldConfig?.type === "date" && rule.operator === "within" ? (
                            <select
                              value={rule.value}
                              onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            >
                              <option value="">Select...</option>
                              {DATE_VALUES?.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          ) : fieldConfig?.type === "select" ? (
                            <select
                              value={rule.value}
                              onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            >
                              <option value="">Select...</option>
                              {fieldConfig.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : fieldConfig?.type === "boolean" ? (
                            <div className="flex-1" />
                          ) : (
                            <input
                              type={fieldConfig?.type === "number" ? "number" : "text"}
                              value={rule.value}
                              onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
                              placeholder="Enter value..."
                              disabled={!rule.operator}
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                            />
                          )}

                          {/* Delete Rule */}
                          <button onClick={() => deleteRule(group.id, rule.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button onClick={() => addRule(group.id)}
                    className="mt-2 flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300">
                    <Plus className="w-4 h-4" /> Add Rule
                  </button>
                </div>
              </div>
            ))}

            <button onClick={addGroup}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-all flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Add Rule Group (OR)
            </button>
          </GlassCard>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Audience Preview</h3>
            
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-purple-400" />
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                {loading ? "..." : estimatedSize.toLocaleString()}
              </div>
              <div className="text-gray-400">Estimated Users</div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">% of Total Users</span>
                <span className="text-white">{((estimatedSize / 125000) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(estimatedSize / 125000) * 100}%` }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">ACTIVE FILTERS</h3>
            <div className="space-y-2">
              {groups.flatMap(g => g.rules).filter(r => r.field && r.operator).map(rule => {
                const field = getFieldConfig(rule.field);
                return (
                  <div key={rule.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    {field?.icon && <field.icon className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm text-white">{field?.label}</span>
                    <span className="text-xs text-gray-500">{rule.operator}</span>
                    <span className="text-sm text-purple-400">{rule.value}</span>
                  </div>
                );
              })}
              {groups.flatMap(g => g.rules).filter(r => r.field).length === 0 && (
                <p className="text-sm text-gray-500">No filters applied</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

