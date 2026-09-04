"use client";

import { useState, useEffect } from "react";
import { Minus, Square, X, Brain } from "lucide-react";

interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export default function TitleBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setIsElectron(!!window.electronAPI?.isElectron);
  }, []);

  if (!isElectron) return null;

  return (
    <div className="titlebar-drag fixed top-0 left-0 right-0 z-[9999] h-9 flex items-center justify-between select-none bg-gradient-to-r from-[rgba(10,10,15,0.97)] to-[rgba(18,18,26,0.97)] border-b border-[rgba(124,58,237,0.12)] backdrop-blur-[20px]">
      {/* App Identity */}
      <div className="flex items-center gap-2 pl-4">
        <Brain className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
          Study Hub
        </span>
      </div>

      {/* Window Controls */}
      <div className="titlebar-no-drag flex items-center h-full">
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="h-full px-3.5 flex items-center justify-center hover:bg-white/[0.08] transition-colors group"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5 text-white/50 group-hover:text-white/90 transition-colors" />
        </button>
        <button
          onClick={() => {
            window.electronAPI?.maximize();
            setIsMaximized(!isMaximized);
          }}
          className="h-full px-3.5 flex items-center justify-center hover:bg-white/[0.08] transition-colors group"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          <Square className="w-3 h-3 text-white/50 group-hover:text-white/90 transition-colors" />
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="h-full px-3.5 flex items-center justify-center hover:bg-red-500/80 transition-colors group"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}
