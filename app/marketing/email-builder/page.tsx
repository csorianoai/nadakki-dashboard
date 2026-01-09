"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, Save, Eye, Undo, Redo, Send, Settings,
  Type, Image, Square, Layout, Columns, List, Link2, Divide,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Palette, GripVertical, Plus, X, Trash2, Copy, Code, Smartphone, Monitor
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface EmailBlock {
  id: string;
  type: "header" | "text" | "image" | "button" | "columns" | "divider" | "spacer" | "social";
  content: any;
  style: Record<string, any>;
}

const BLOCK_TYPES = [
  { type: "header", icon: Type, label: "Header" },
  { type: "text", icon: Type, label: "Text" },
  { type: "image", icon: Image, label: "Image" },
  { type: "button", icon: Square, label: "Button" },
  { type: "columns", icon: Columns, label: "Columns" },
  { type: "divider", icon: Divide, label: "Divider" },
  { type: "spacer", icon: Layout, label: "Spacer" },
  { type: "social", icon: Link2, label: "Social" },
];

const DEFAULT_BLOCKS: EmailBlock[] = [
  {
    id: "b1",
    type: "header",
    content: { text: "Your Company", logoUrl: "" },
    style: { backgroundColor: "#8b5cf6", padding: 20, textAlign: "center", color: "#ffffff" },
  },
  {
    id: "b2",
    type: "image",
    content: { src: "https://via.placeholder.com/600x300/8b5cf6/ffffff?text=Hero+Image", alt: "Hero" },
    style: { width: "100%" },
  },
  {
    id: "b3",
    type: "text",
    content: { html: "<h1 style='margin:0;color:#1a1a1a;'>Welcome to Our Newsletter!</h1>" },
    style: { padding: "20px 30px", textAlign: "center" },
  },
  {
    id: "b4",
    type: "text",
    content: { html: "<p style='color:#666;line-height:1.6;'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>" },
    style: { padding: "0 30px 20px", textAlign: "center" },
  },
  {
    id: "b5",
    type: "button",
    content: { text: "Shop Now", url: "#" },
    style: { backgroundColor: "#8b5cf6", color: "#ffffff", padding: "14px 32px", borderRadius: 8, textAlign: "center" },
  },
  {
    id: "b6",
    type: "divider",
    content: {},
    style: { borderColor: "#e5e5e5", margin: "30px 0" },
  },
  {
    id: "b7",
    type: "columns",
    content: {
      columns: [
        { title: "Feature 1", description: "Amazing feature description", icon: "✨" },
        { title: "Feature 2", description: "Another great feature", icon: "🚀" },
        { title: "Feature 3", description: "The best feature yet", icon: "💎" },
      ]
    },
    style: { padding: "0 20px" },
  },
  {
    id: "b8",
    type: "text",
    content: { html: "<p style='color:#999;font-size:12px;'>© 2024 Your Company. All rights reserved.<br/>Unsubscribe | Privacy Policy</p>" },
    style: { padding: 30, textAlign: "center", backgroundColor: "#f5f5f5" },
  },
];

export default function EmailBuilderPage() {
  const [blocks, setBlocks] = useState<EmailBlock[]>(DEFAULT_BLOCKS);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);

  const selectedBlockData = blocks.find(b => b.id === selectedBlock);

  const addBlock = (type: EmailBlock["type"]) => {
    const newBlock: EmailBlock = {
      id: `b-${Date.now()}`,
      type,
      content: type === "text" ? { html: "<p>New text block</p>" }
        : type === "button" ? { text: "Click Here", url: "#" }
        : type === "image" ? { src: "https://via.placeholder.com/600x200", alt: "Image" }
        : type === "header" ? { text: "Header", logoUrl: "" }
        : type === "divider" ? {}
        : type === "spacer" ? {}
        : {},
      style: type === "button" 
        ? { backgroundColor: "#8b5cf6", color: "#fff", padding: "12px 24px", borderRadius: 6, textAlign: "center" }
        : { padding: 20 },
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    setBlocks(blocks?.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    setSelectedBlock(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const idx = blocks.findIndex(b => b.id === id);
    if (direction === "up" && idx > 0) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx - 1]] = [newBlocks[idx - 1], newBlocks[idx]];
      setBlocks(newBlocks);
    } else if (direction === "down" && idx < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
      setBlocks(newBlocks);
    }
  };

  const renderBlock = (block: EmailBlock) => {
    switch (block.type) {
      case "header":
        return (
          <div style={{ ...block.style, fontSize: 24, fontWeight: "bold" }}>
            {block.content.logoUrl ? <img src={block.content.logoUrl} alt="Logo" style={{ height: 40 }} /> : block.content.text}
          </div>
        );
      case "text":
        return <div style={block.style} dangerouslySetInnerHTML={{ __html: block.content.html }} />;
      case "image":
        return <img src={block.content.src} alt={block.content.alt} style={{ width: "100%", display: "block" }} />;
      case "button":
        return (
          <div style={{ textAlign: block.style.textAlign || "center", padding: "20px 0" }}>
            <a href={block.content.url} style={{ 
              display: "inline-block", 
              backgroundColor: block.style.backgroundColor,
              color: block.style.color,
              padding: block.style.padding,
              borderRadius: block.style.borderRadius,
              textDecoration: "none",
              fontWeight: "bold",
            }}>
              {block.content.text}
            </a>
          </div>
        );
      case "divider":
        return <hr style={{ border: "none", borderTop: `1px solid ${block.style.borderColor || "#e5e5e5"}`, margin: block.style.margin }} />;
      case "spacer":
        return <div style={{ height: 30 }} />;
      case "columns":
        return (
          <div style={{ display: "flex", gap: 20, ...block.style }}>
            {block.content.columns?.map((col: any, i: number) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{col.icon}</div>
                <h3 style={{ margin: "0 0 8px", color: "#1a1a1a" }}>{col.title}</h3>
                <p style={{ margin: 0, color: "#666", fontSize: 14 }}>{col.description}</p>
              </div>
            ))}
          </div>
        );
      default:
        return <div>Unknown block type</div>;
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
            <input type="text" defaultValue="Email Campaign" className="text-lg font-bold bg-transparent border-none text-white focus:outline-none" />
            <div className="text-xs text-gray-500">Email Builder</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-lg p-1">
            <button onClick={() => setViewMode("desktop")} className={`p-2 rounded ${viewMode === "desktop" ? "bg-purple-500 text-white" : "text-gray-400"}`}>
              <Monitor className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("mobile")} className={`p-2 rounded ${viewMode === "mobile" ? "bg-purple-500 text-white" : "text-gray-400"}`}>
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowCode(!showCode)} className={`p-2 rounded-lg ${showCode ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400"}`}>
            <Code className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            <Send className="w-4 h-4" /> Test
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Blocks */}
        <div className="w-64 border-r border-white/10 bg-[#0d1117] p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-400 mb-3">CONTENT BLOCKS</h3>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_TYPES?.map(block => (
              <button
                key={block.type}
                onClick={() => addBlock(block.type as EmailBlock["type"])}
                className="p-3 border border-white/10 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all flex flex-col items-center gap-1"
              >
                <block.icon className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400">{block.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#1a1f2e]">
          <div 
            className="mx-auto bg-white shadow-xl"
            style={{ width: viewMode === "desktop" ? 600 : 375, minHeight: 800 }}
          >
            {blocks?.map((block, idx) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlock(block.id)}
                className={`relative group cursor-pointer ${selectedBlock === block.id ? "ring-2 ring-purple-500" : ""}`}
              >
                {/* Block Controls */}
                <div className={`absolute -left-10 top-1/2 -translate-y-1/2 flex-col gap-1 ${selectedBlock === block.id ? "flex" : "hidden group-hover:flex"}`}>
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }} className="p-1 bg-white/10 rounded text-gray-400 hover:text-white">▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down"); }} className="p-1 bg-white/10 rounded text-gray-400 hover:text-white">▼</button>
                </div>
                <div className={`absolute -right-10 top-1/2 -translate-y-1/2 flex-col gap-1 ${selectedBlock === block.id ? "flex" : "hidden group-hover:flex"}`}>
                  <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="p-1 bg-red-500/20 rounded text-red-400 hover:text-red-300">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {renderBlock(block)}
              </div>
            ))}
            
            {/* Add Block Button */}
            <div className="p-4 border-2 border-dashed border-gray-200 m-4 rounded-lg text-center">
              <button onClick={() => addBlock("text")} className="text-gray-400 hover:text-purple-500">
                <Plus className="w-6 h-6 mx-auto" />
                <span className="text-sm">Add Block</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l border-white/10 bg-[#0d1117] p-4 overflow-y-auto">
          {selectedBlockData ? (
            <>
              <h3 className="text-sm font-medium text-white mb-4">Block Settings</h3>
              
              {selectedBlockData.type === "text" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 block mb-1">Content</label>
                  <textarea
                    value={selectedBlockData.content.html}
                    onChange={(e) => updateBlock(selectedBlockData.id, { content: { ...selectedBlockData.content, html: e.target.value } })}
                    rows={6}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              )}

              {selectedBlockData.type === "button" && (
                <>
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Button Text</label>
                    <input
                      type="text"
                      value={selectedBlockData.content.text}
                      onChange={(e) => updateBlock(selectedBlockData.id, { content: { ...selectedBlockData.content, text: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">URL</label>
                    <input
                      type="text"
                      value={selectedBlockData.content.url}
                      onChange={(e) => updateBlock(selectedBlockData.id, { content: { ...selectedBlockData.content, url: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Background Color</label>
                    <input
                      type="color"
                      value={selectedBlockData.style.backgroundColor}
                      onChange={(e) => updateBlock(selectedBlockData.id, { style: { ...selectedBlockData.style, backgroundColor: e.target.value } })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}

              {selectedBlockData.type === "image" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={selectedBlockData.content.src}
                    onChange={(e) => updateBlock(selectedBlockData.id, { content: { ...selectedBlockData.content, src: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Padding</label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={parseInt(selectedBlockData.style.padding) || 20}
                  onChange={(e) => updateBlock(selectedBlockData.id, { style: { ...selectedBlockData.style, padding: parseInt(e.target.value) } })}
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a block to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

