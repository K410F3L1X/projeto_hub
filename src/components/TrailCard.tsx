"use client";

import { Folder, ChevronRight } from "lucide-react";

interface TrailCardProps {
  name: string;
  noteCount: number;
  onClick?: () => void;
  gradient?: string;
}

const folderGradients: Record<string, string> = {
  "Conceitos e Definições": "from-violet-600/20 to-indigo-600/20",
  "Reservatorio de Dopamina": "from-emerald-600/20 to-teal-600/20",
  "Biblioteca": "from-amber-600/20 to-orange-600/20",
  "Pessoas e Entidades": "from-blue-600/20 to-cyan-600/20",
  "Faculdade": "from-rose-600/20 to-pink-600/20",
  "Programação": "from-cyan-600/20 to-sky-600/20",
  "Python": "from-yellow-600/20 to-lime-600/20",
  "Comunicação": "from-fuchsia-600/20 to-purple-600/20",
  "Inglês": "from-red-600/20 to-rose-600/20",
  "Pensamentos": "from-slate-600/20 to-zinc-600/20",
};

const folderEmojis: Record<string, string> = {
  "Conceitos e Definições": "💡",
  "Reservatorio de Dopamina": "🧪",
  "Biblioteca": "📚",
  "Pessoas e Entidades": "👤",
  "Faculdade": "🎓",
  "Programação": "💻",
  "Python": "🐍",
  "Comunicação": "🗣️",
  "Inglês": "🇬🇧",
  "Pensamentos": "💭",
};

export default function TrailCard({ name, noteCount, onClick }: TrailCardProps) {
  const gradient = folderGradients[name] || "from-violet-600/20 to-indigo-600/20";
  const emoji = folderEmojis[name] || "📁";

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left glass glass-hover rounded-2xl p-5
        bg-gradient-to-br ${gradient}
        group cursor-pointer relative overflow-hidden
        transition-all duration-300
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-text-primary text-[15px] group-hover:text-white transition-colors">
              {name}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {noteCount} {noteCount === 1 ? "nota" : "notas"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Progress bar aesthetic */}
      <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full gradient-accent transition-all duration-700"
          style={{ width: `${Math.min((noteCount / 35) * 100, 100)}%` }}
        />
      </div>
    </button>
  );
}
