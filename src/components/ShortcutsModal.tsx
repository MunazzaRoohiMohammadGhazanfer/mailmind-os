import React from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "J", action: "Next email" },
  { key: "K", action: "Previous email" },
  { key: "E", action: "Archive selected email" },
  { key: "S", action: "Star / Unstar selected email" },
  { key: "/", action: "Focus search box" },
  { key: "C", action: "Open Compose" },
  { key: "R", action: "Refresh inbox" },
  { key: "?", action: "Toggle shortcuts help" },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#121212] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <h2
              id="shortcuts-title"
              className="text-sm font-semibold text-white"
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
            aria-label="Close shortcuts help"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 divide-y divide-white/[0.06]">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="py-2.5 flex items-center justify-between text-xs"
            >
              <span className="text-zinc-300">{item.action}</span>
              <kbd className="px-2 py-1 rounded-md bg-[#1C1C1C] border border-white/15 font-mono text-[11px] font-semibold text-emerald-400">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
