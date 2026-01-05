"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger"
}: ConfirmModalProps) {
  const variantStyles = {
    danger: { bg: "bg-red-500", hover: "hover:bg-red-600", icon: "text-red-400" },
    warning: { bg: "bg-yellow-500", hover: "hover:bg-yellow-600", icon: "text-yellow-400" },
    info: { bg: "bg-blue-500", hover: "hover:bg-blue-600", icon: "text-blue-400" },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${styles.icon}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400 mt-1">{message}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 font-medium transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-4 py-2 ${styles.bg} ${styles.hover} rounded-lg text-white font-medium transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
