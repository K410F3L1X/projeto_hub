"use client";

import { useState, useEffect } from "react";
import { Folder, FileText, ChevronRight, ChevronDown, Database, Search } from "lucide-react";
import NoteModal from "@/components/NoteModal";

interface FileTree {
  [folder: string]: string[];
}

export default function VaultPage() {
  const [fileTree, setFileTree] = useState<FileTree>({});
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/vault/files")
      .then((res) => res.json())
      .then((data) => {
        setFileTree(data.files || {});
        // Expand all folders by default
        const initialExpanded: Record<string, boolean> = {};
        Object.keys(data.files || {}).forEach((folder) => {
          initialExpanded[folder] = true;
        });
        setExpandedFolders(initialExpanded);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load vault files:", err);
        setLoading(false);
      });
  }, []);

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  const folders = Object.keys(fileTree).sort();

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="gradient-text">Cofre</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20">
            <Database className="w-3.5 h-3.5 text-accent-light" />
          </span>
        </h1>
        <p className="text-text-secondary mt-1.5 text-[15px]">
          Explore todas as pastas e notas do seu Segundo Cérebro.
        </p>
      </div>

      {/* Filter / Search */}
      <div className="mb-6 glass rounded-xl px-4 py-3 border border-border-subtle flex items-center gap-3">
        <Search className="w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Filtrar notas pelo nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-[15px] focus:outline-none text-text-primary placeholder:text-text-muted/60 w-full"
        />
      </div>

      {/* Vault Explorer */}
      <div className="glass rounded-xl border border-border-subtle overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">A carregar o cofre...</p>
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Database className="w-10 h-10 mb-4 opacity-50" />
            <p className="text-sm">Nenhum ficheiro encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {folders.map((folder) => {
              const isExpanded = expandedFolders[folder];
              const files = fileTree[folder] || [];
              const filteredFiles = files.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

              // Skip rendering folder if search is active and no files match
              if (searchQuery && filteredFiles.length === 0) return null;

              return (
                <div key={folder} className="border-b border-border-subtle last:border-0">
                  {/* Folder Header */}
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-overlay transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-accent-light transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-light transition-colors" />
                      )}
                      <Folder className="w-4 h-4 text-accent-light" />
                      <span className="font-semibold text-[15px] text-text-primary">
                        {folder}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-text-muted bg-surface-overlay px-2 py-0.5 rounded-md">
                      {files.length}
                    </span>
                  </button>

                  {/* File List */}
                  {isExpanded && (
                    <div className="bg-black/20 px-5 py-2 space-y-0.5 border-t border-border-subtle/50">
                      {filteredFiles.map((filename) => {
                        const path = folder === "Root" ? filename : `${folder}/${filename}`;
                        const displayTitle = filename.replace(/\.md$/, "");
                        
                        return (
                          <button
                            key={path}
                            onClick={() => setSelectedNote(path)}
                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-surface-raised transition-all group text-left"
                          >
                            <FileText className="w-4 h-4 text-text-muted group-hover:text-violet-400 transition-colors" />
                            <span className="text-sm text-text-secondary group-hover:text-text-primary truncate">
                              {displayTitle}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {selectedNote && (
        <NoteModal
          path={selectedNote}
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
}
