"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  FileText,
  FolderTree,
  FolderOpen,
  ArrowUpDown,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface TrailNotesModalProps {
  folderName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (path: string) => void;
}

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

export default function TrailNotesModal({
  folderName,
  isOpen,
  onClose,
  onSelectNote,
}: TrailNotesModalProps) {
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"name-asc" | "name-desc" | "subfolder">("name-asc");

  useEffect(() => {
    if (!isOpen || !folderName) return;

    setLoading(true);
    setSearch("");
    fetch(`/api/vault/notes?directory=${encodeURIComponent(folderName)}`)
      .then((res) => res.json())
      .then((data) => {
        setNotes(data.files || []);
      })
      .catch((err) => {
        console.error("Failed to load trail notes:", err);
        setNotes([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, folderName]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Process and filter notes
  const processedNotes = useMemo(() => {
    if (!folderName) return [];

    let filtered = notes.filter((notePath) => {
      const fileName = notePath.split("/").pop()?.replace(/\.md$/, "") || "";
      return fileName.toLowerCase().includes(search.toLowerCase()) ||
        notePath.toLowerCase().includes(search.toLowerCase());
    });

    return filtered.sort((a, b) => {
      const nameA = a.split("/").pop()?.replace(/\.md$/, "") || "";
      const nameB = b.split("/").pop()?.replace(/\.md$/, "") || "";

      if (sortOrder === "name-asc") {
        return nameA.localeCompare(nameB, "pt", { sensitivity: "base" });
      }
      if (sortOrder === "name-desc") {
        return nameB.localeCompare(nameA, "pt", { sensitivity: "base" });
      }
      // sortOrder === 'subfolder'
      return a.localeCompare(b, "pt", { sensitivity: "base" });
    });
  }, [notes, folderName, search, sortOrder]);

  if (!isOpen || !folderName) return null;

  const emoji = folderEmojis[folderName] || "📁";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in">
      {/* Backdrop with strong blur and darkness */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#14141c] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span>{folderName}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-light border border-accent/20 font-medium">
                  {notes.length} {notes.length === 1 ? "nota" : "notas"}
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Todas as notas e subpastas desta trilha de conhecimento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-zinc-800/60 bg-zinc-900/40 flex flex-col sm:flex-row items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar nesta trilha..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-accent/60 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              Ordenar:
            </span>
            <button
              onClick={() => setSortOrder("name-asc")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                sortOrder === "name-asc"
                  ? "bg-accent/15 text-accent-light font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              A-Z
            </button>
            <button
              onClick={() => setSortOrder("name-desc")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                sortOrder === "name-desc"
                  ? "bg-accent/15 text-accent-light font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Z-A
            </button>
            <button
              onClick={() => setSortOrder("subfolder")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                sortOrder === "subfolder"
                  ? "bg-accent/15 text-accent-light font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Subpasta
            </button>
          </div>
        </div>

        {/* Notes Content List */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[55vh] custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400 text-sm">
              <Loader2 className="w-7 h-7 animate-spin text-accent-light" />
              <span>Carregando notas da trilha...</span>
            </div>
          ) : processedNotes.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-zinc-400" />
              <p className="text-sm font-medium">Nenhuma nota encontrada</p>
              <p className="text-xs text-zinc-600 mt-1">
                {search ? `Nenhum resultado para "${search}"` : "Esta pasta ainda não possui notas."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {processedNotes.map((notePath) => {
                const parts = notePath.split("/");
                const filename = parts.pop() || notePath;
                const title = filename.replace(/\.md$/, "");
                const relativeFolder = parts.slice(folderName.split("/").length).join(" / ");

                return (
                  <button
                    key={notePath}
                    onClick={() => {
                      onSelectNote(notePath);
                    }}
                    className="flex flex-col text-left p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/70 border border-zinc-800/70 hover:border-accent/40 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-zinc-400 group-hover:text-accent-light mt-0.5 flex-shrink-0 transition-colors" />
                        <span className="text-sm font-medium text-text-primary group-hover:text-white line-clamp-1 transition-colors">
                          {title}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-accent-light opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>

                    {/* Subfolder Badge if applicable */}
                    {relativeFolder && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-950/60 px-2 py-0.5 rounded-md border border-zinc-800/50 w-fit max-w-full">
                        <FolderTree className="w-3 h-3 text-accent-light flex-shrink-0" />
                        <span className="truncate">{relativeFolder}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Exibindo <strong>{processedNotes.length}</strong> de <strong>{notes.length}</strong> notas
          </span>
          <span className="text-[11px] text-zinc-600">
            Clique em qualquer nota para abri-la e editá-la
          </span>
        </div>
      </div>
    </div>
  );
}
