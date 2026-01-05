"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, Smartphone, Tablet, Monitor, Save, Eye, Undo, Redo,
  Type, Image, Square, Circle, MousePointer, Trash2, Copy, Layers,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Palette, Move, Plus, X, Check, Settings, Download, Upload
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

type DeviceType = "mobile" | "tablet" | "desktop";

interface ElementStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  padding?: number;
  borderRadius?: number;
  width?: string;
  height?: string;
}

interface CanvasElement {
  id: string;
  type: "text" | "button" | "image" | "container";
  content: string;
  style: ElementStyle;
  position: { x: number; y: number };
}

const DEVICE_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
};

const TEMPLATES = [
  { id: "t1", name: "Email Signup", preview: "📧" },
  { id: "t2", name: "Promo Banner", preview: "🎉" },
  { id: "t3", name: "Survey Request", preview: "📝" },
  { id: "t4", name: "App Rating", preview: "⭐" },
  { id: "t5", name: "Feature Announcement", preview: "🆕" },
];

const COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#ffffff", "#000000"];

export default function InAppEditorPage() {
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: "el-1",
      type: "container",
      content: "",
      style: { backgroundColor: "#ffffff", borderRadius: 16, padding: 24, width: "90%", height: "auto" },
      position: { x: 50, y: 50 },
    },
    {
      id: "el-2",
      type: "image",
      content: "🎁",
      style: { fontSize: 48, textAlign: "center", width: "100%" },
      position: { x: 0, y: 0 },
    },
    {
      id: "el-3",
      type: "text",
      content: "Special Offer!",
      style: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
      position: { x: 0, y: 80 },
    },
    {
      id: "el-4",
      type: "text",
      content: "Get 20% off your next purchase. Limited time only!",
      style: { fontSize: 14, color: "#666666", textAlign: "center" },
      position: { x: 0, y: 120 },
    },
    {
      id: "el-5",
      type: "button",
      content: "Claim Offer",
      style: { backgroundColor: "#8b5cf6", color: "#ffffff", fontSize: 16, fontWeight: "bold", padding: 12, borderRadius: 8, textAlign: "center" },
      position: { x: 0, y: 180 },
    },
    {
      id: "el-6",
      type: "text",
      content: "No thanks",
      style: { fontSize: 12, color: "#999999", textAlign: "center" },
      position: { x: 0, y: 240 },
    },
  ]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const selectedEl = elements.find(e => e.id === selectedElement);

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const updateElementStyle = (id: string, styleUpdates: Partial<ElementStyle>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
    ));
  };

  const addElement = (type: CanvasElement["type"]) => {
    const newElement: CanvasElement = {
      id: `el-${Date.now()}`,
      type,
      content: type === "text" ? "New Text" : type === "button" ? "Button" : "",
      style: type === "button" 
        ? { backgroundColor: "#8b5cf6", color: "#fff", fontSize: 14, padding: 10, borderRadius: 6 }
        : { fontSize: 16, color: "#333" },
      position: { x: 0, y: elements.length * 50 },
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) {
      const newEl = { ...el, id: `el-${Date.now()}`, position: { ...el.position, y: el.position.y + 30 } };
      setElements([...elements, newEl]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-[#0d1117]">
        <div className="flex items-center gap-4">
          <Link href="/marketing/campaigns" className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <input type="text" defaultValue="In-App Message" className="text-lg font-bold bg-transparent border-none text-white focus:outline-none" />
            <div className="text-xs text-gray-500">In-App Message Editor</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Undo className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Redo className="w-4 h-4" /></button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Elements */}
        <div className="w-64 border-r border-white/10 bg-[#0d1117] p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">ELEMENTS</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { type: "text" as const, icon: Type, label: "Text" },
              { type: "button" as const, icon: Square, label: "Button" },
              { type: "image" as const, icon: Image, label: "Image" },
              { type: "container" as const, icon: Layers, label: "Container" },
            ].map(item => (
              <button key={item.type} onClick={() => addElement(item.type)}
                className="p-3 border border-white/10 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all flex flex-col items-center gap-1">
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400">{item.label}</span>
              </button>
            ))}
          </div>

          <h3 className="text-sm font-medium text-gray-400 mb-3">TEMPLATES</h3>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button key={t.id} className="w-full p-3 border border-white/10 rounded-lg hover:border-white/20 text-left flex items-center gap-3">
                <span className="text-2xl">{t.preview}</span>
                <span className="text-sm text-white">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-[#1a1f2e]">
          {/* Device Selector */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { type: "mobile" as const, icon: Smartphone },
              { type: "tablet" as const, icon: Tablet },
              { type: "desktop" as const, icon: Monitor },
            ].map(d => (
              <button key={d.type} onClick={() => setDevice(d.type)}
                className={`p-2 rounded-lg ${device === d.type ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400"}`}>
                <d.icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          {/* Phone Frame */}
          <div className="relative" style={{ width: device === "mobile" ? 320 : device === "tablet" ? 500 : 800 }}>
            <div className={`bg-gray-900 rounded-[40px] p-3 shadow-2xl ${device === "mobile" ? "" : "rounded-[20px]"}`}>
              {/* Phone notch */}
              {device === "mobile" && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
              )}
              
              {/* Screen */}
              <div className="bg-black/80 rounded-[32px] overflow-hidden relative"
                style={{ 
                  height: device === "mobile" ? 580 : device === "tablet" ? 700 : 500,
                  padding: device === "mobile" ? "40px 0" : "20px 0"
                }}>
                
                {/* In-App Message Container */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-[280px] w-full shadow-xl relative">
                    {/* Close button */}
                    <button className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {/* Elements */}
                    {elements.filter(el => el.type !== "container").map(el => (
                      <div
                        key={el.id}
                        onClick={() => setSelectedElement(el.id)}
                        className={`cursor-pointer transition-all ${selectedElement === el.id ? "ring-2 ring-purple-500 ring-offset-2" : ""}`}
                        style={{
                          marginBottom: 16,
                          ...el.style,
                          ...(el.type === "button" && {
                            display: "block",
                            width: "100%",
                            cursor: "pointer",
                          }),
                        }}
                      >
                        {el.content}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l border-white/10 bg-[#0d1117] p-4 overflow-y-auto">
          {selectedEl ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Properties</h3>
                <div className="flex gap-1">
                  <button onClick={() => duplicateElement(selectedEl.id)} className="p-1 hover:bg-white/10 rounded text-gray-400"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => deleteElement(selectedEl.id)} className="p-1 hover:bg-white/10 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Content */}
              {selectedEl.type !== "image" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 block mb-1">Content</label>
                  <input
                    type="text"
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              )}

              {/* Font Size */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                <input
                  type="range"
                  min="10"
                  max="48"
                  value={selectedEl.style.fontSize || 16}
                  onChange={(e) => updateElementStyle(selectedEl.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{selectedEl.style.fontSize || 16}px</span>
              </div>

              {/* Text Align */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Alignment</label>
                <div className="flex gap-1">
                  {[
                    { value: "left" as const, icon: AlignLeft },
                    { value: "center" as const, icon: AlignCenter },
                    { value: "right" as const, icon: AlignRight },
                  ].map(align => (
                    <button
                      key={align.value}
                      onClick={() => updateElementStyle(selectedEl.id, { textAlign: align.value })}
                      className={`p-2 rounded ${selectedEl.style.textAlign === align.value ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400"}`}
                    >
                      <align.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Text Color</label>
                <div className="flex flex-wrap gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateElementStyle(selectedEl.id, { color })}
                      className={`w-6 h-6 rounded-full border-2 ${selectedEl.style.color === color ? "border-purple-500" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {selectedEl.type === "button" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 block mb-1">Background Color</label>
                  <div className="flex flex-wrap gap-1">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateElementStyle(selectedEl.id, { backgroundColor: color })}
                        className={`w-6 h-6 rounded-full border-2 ${selectedEl.style.backgroundColor === color ? "border-purple-500" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Border Radius */}
              {selectedEl.type === "button" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 block mb-1">Border Radius</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={selectedEl.style.borderRadius || 0}
                    onChange={(e) => updateElementStyle(selectedEl.id, { borderRadius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{selectedEl.style.borderRadius || 0}px</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              <MousePointer className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select an element to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


