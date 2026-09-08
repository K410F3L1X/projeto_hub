"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  FolderOpen,
  FolderTree,
  ChevronDown,
  Check,
  Plus,
  Search,
  Loader2,
  FolderPlus,
  X,
} from "lucide-react";

interface FolderSelectorProps {
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  className?: string;
}

export default function FolderSelector({
  selectedFolder,
  onSelectFolder,
  className = "",
}: FolderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createInsideCurrent, setCreateInsideCurrent] = useState(false);
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Fetch folders from API
  const fetchFolders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vault/folders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.folders) && data.folders.length > 0) {
          setFolders(data.folders);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar pastas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Focus inputs on open/mode switch
  useEffect(() => {
    if (isOpen) {
      if (isCreating) {
        setTimeout(() => newFolderInputRef.current?.focus(), 60);
      } else {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
    }
  }, [isOpen, isCreating]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setCreationError(null);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Filtered folders
  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders;
    const q = search.toLowerCase();
    return folders.filter((f) => f.toLowerCase().includes(q));
  }, [folders, search]);

  // Handle folder creation
  const handleCreateFolder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed || isSavingFolder) return;

    setCreationError(null);
    setIsSavingFolder(true);

    let targetPath = trimmed;
    if (createInsideCurrent && selectedFolder) {
      targetPath = `${selectedFolder}/${trimmed}`;
    }

    try {
      const res = await fetch("/api/vault/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao criar pasta.");
      }

      const createdFolder = data.folder || targetPath;

      // Add to folder list if not already present
      setFolders((prev) => {
        if (prev.includes(createdFolder)) return prev;
        return [...prev, createdFolder].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );
      });

      // Select newly created folder
      onSelectFolder(createdFolder);

      // Reset form and close
      setNewFolderName("");
      setIsCreating(false);
      setIsOpen(false);
    } catch (err) {
      setCreationError(err instanceof Error ? err.message : "Erro ao criar pasta");
    } finally {
      setIsSavingFolder(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsCreating(false);
          setCreationError(null);
        }}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-overlay border border-border-subtle hover:border-accent/40 rounded-xl hover:bg-surface-overlay/80 transition-all text-sm group"
        title="Selecione o destino da nota"
      >
        <FolderOpen className="w-4 h-4 text-accent-light flex-shrink-0" />
        <span className="text-text-primary font-medium truncate max-w-[200px] sm:max-w-[280px]">
          {selectedFolder || "Selecionar pasta..."}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ml-0.5 flex-shrink-0 ${
            isOpen ? "rotate-180 text-accent-light" : "group-hover:text-text-secondary"
          }`}
        />
      </button>

      {/* Popover / Dropdown with Solid Dark Theme */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up flex flex-col">
          {/* Popover Header / Search */}
          <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/60">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs text-zinc-400 focus-within:border-accent/60 transition-colors">
              <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar pasta ou subpasta..."
                className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-500 text-xs focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Folder List (Hierarchical Tree / Breadcrumbs) */}
          <div className="p-2 max-h-[280px] overflow-y-auto divide-y divide-zinc-800/30">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-accent-light" />
                <span>Carregando pastas do cofre...</span>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Nenhuma pasta encontrada para &quot;{search}&quot;.
              </div>
            ) : (
              filteredFolders.map((folderPath) => {
                const isSelected = selectedFolder === folderPath;
                const pathParts = folderPath.split("/");
                const isSubfolder = pathParts.length > 1;
                const folderName = pathParts[pathParts.length - 1];
                const parentPath = isSubfolder ? pathParts.slice(0, -1).join(" / ") : null;

                return (
                  <button
                    key={folderPath}
                    type="button"
                    onClick={() => {
                      onSelectFolder(folderPath);
                      setIsOpen(false);
                      setIsCreating(false);
                    }}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group ${
                      isSelected
                        ? "bg-accent/15 text-accent-light font-medium"
                        : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isSubfolder ? (
                        <FolderTree
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isSelected ? "text-accent-light" : "text-zinc-500 group-hover:text-zinc-400"
                          }`}
                        />
                      ) : (
                        <FolderOpen
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isSelected ? "text-accent-light" : "text-zinc-400 group-hover:text-accent-light"
                          }`}
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        {/* Parent breadcrumb */}
                        {parentPath && (
                          <div className="text-[10px] text-zinc-500 truncate leading-tight group-hover:text-zinc-400">
                            {parentPath} /
                          </div>
                        )}
                        {/* Folder name */}
                        <div className="truncate font-medium text-xs">
                          {folderName}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 ml-2 text-accent-light flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Creation Section Footer */}
          <div className="p-2.5 border-t border-zinc-800 bg-zinc-900/90">
            {!isCreating ? (
              <button
                type="button"
                onClick={() => {
                  setIsCreating(true);
                  setCreationError(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-all group"
              >
                <Plus className="w-3.5 h-3.5 text-accent-light group-hover:scale-110 transition-transform" />
                <span>Criar Novo Tema / Pasta</span>
              </button>
            ) : (
              <form onSubmit={handleCreateFolder} className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <FolderPlus className="w-3 h-3 text-accent-light" />
                    Nova Pasta
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setCreationError(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <input
                  ref={newFolderInputRef}
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nome (ex: Projetos ou TI/Cloud)"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-accent"
                />

                {selectedFolder && (
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-400 select-none">
                    <input
                      type="checkbox"
                      checked={createInsideCurrent}
                      onChange={(e) => setCreateInsideCurrent(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-accent focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="truncate">
                      Criar dentro de <strong className="text-zinc-300">{selectedFolder}</strong>
                    </span>
                  </label>
                )}

                {creationError && (
                  <p className="text-[11px] text-red-400">{creationError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setCreationError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim() || isSavingFolder}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium gradient-accent text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isSavingFolder ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Criar
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
