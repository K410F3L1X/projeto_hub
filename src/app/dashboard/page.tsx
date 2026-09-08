"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  FolderOpen,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FolderTree,
  ExternalLink,
  Loader2,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import TrailCard from "@/components/TrailCard";
import NotePreview from "@/components/NotePreview";
import NoteModal from "@/components/NoteModal";
import TrailNotesModal from "@/components/TrailNotesModal";

interface FolderInfo {
  folder: string;
  count: number;
}

interface RecentFile {
  path: string;
  mtime: number;
  ctime: number;
  size: number;
}

interface VaultOverview {
  totalNotes: number;
  topFolders: FolderInfo[];
  recentFiles: RecentFile[];
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<VaultOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [folderNotes, setFolderNotes] = useState<Record<string, string[]>>({});
  const [loadingFolder, setLoadingFolder] = useState<string | null>(null);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [showAllInline, setShowAllInline] = useState<Record<string, boolean>>({});
  const [modalTrail, setModalTrail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vault/notes")
      .then((res) => res.json())
      .then((data) => {
        setOverview(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleTrailClick = async (folderName: string) => {
    if (expandedFolder === folderName) {
      setExpandedFolder(null);
      return;
    }
    setExpandedFolder(folderName);

    if (!folderNotes[folderName]) {
      setLoadingFolder(folderName);
      try {
        const res = await fetch(`/api/vault/notes?directory=${encodeURIComponent(folderName)}`);
        const data = await res.json();
        setFolderNotes((prev) => ({ ...prev, [folderName]: data.files || [] }));
      } catch {
        setFolderNotes((prev) => ({ ...prev, [folderName]: [] }));
      } finally {
        setLoadingFolder(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Carregando o vault...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Obsidian não encontrado</h2>
          <p className="text-sm text-text-secondary">
            Verifique se o Obsidian está aberto com o plugin REST API ativo.
          </p>
        </div>
      </div>
    );
  }

  const lastEditTime = overview.recentFiles[0]?.mtime;
  const now = Date.now();
  const daysSinceEdit = lastEditTime ? Math.floor((now - lastEditTime) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Segundo Cérebro</span>
        </h1>
        <p className="text-text-secondary mt-1.5 text-[15px]">
          Visão panorâmica do seu vault de conhecimento
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          icon={FileText}
          value={overview.totalNotes}
          label="Notas totais"
          accentColor="rgba(124,58,237,0.08)"
        />
        <StatCard
          icon={FolderOpen}
          value={overview.topFolders.length}
          label="Pastas"
          accentColor="rgba(16,185,129,0.08)"
        />
        <StatCard
          icon={TrendingUp}
          value={overview.topFolders[0]?.count || 0}
          label="Maior trilha"
          trend={overview.topFolders[0]?.folder}
          accentColor="rgba(245,158,11,0.08)"
        />
        <StatCard
          icon={Clock}
          value={daysSinceEdit === 0 ? "Hoje" : `${daysSinceEdit}d`}
          label="Última edição"
          accentColor="rgba(59,130,246,0.08)"
        />
      </div>

      {/* Trail Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-accent-light" />
            Trilhas de Estudo
          </h2>
          <span className="text-xs text-text-muted px-3 py-1 glass rounded-full">
            {overview.topFolders.length} trilhas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {overview.topFolders.map((folder) => {
            const isExpanded = expandedFolder === folder.folder;
            const isLoadingThis = loadingFolder === folder.folder;
            const allNotes = folderNotes[folder.folder] || [];
            const isShowingAll = showAllInline[folder.folder] || allNotes.length <= 5;
            const displayedNotes = isShowingAll ? allNotes : allNotes.slice(0, 5);

            return (
              <div key={folder.folder} className="flex flex-col">
                <TrailCard
                  name={folder.folder}
                  noteCount={folder.count}
                  isExpanded={isExpanded}
                  onClick={() => handleTrailClick(folder.folder)}
                  onOpenModal={() => setModalTrail(folder.folder)}
                />

                {/* Expanded folder notes with smooth scroll */}
                {isExpanded && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-[#12121a]/90 border border-zinc-800/80 shadow-xl animate-slide-up">
                    {isLoadingThis ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-accent-light" />
                        <span>Carregando notas...</span>
                      </div>
                    ) : allNotes.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">
                        Nenhuma nota encontrada nesta pasta.
                      </p>
                    ) : (
                      <>
                        <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
                          {displayedNotes.map((notePath) => {
                            const parts = notePath.split("/");
                            const filename = parts.pop() || notePath;
                            const title = filename.replace(/\.md$/, "");
                            const subfolder = parts.length > 1 ? parts.slice(1).join(" / ") : null;

                            return (
                              <button
                                key={notePath}
                                onClick={() => setSelectedNote(notePath)}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-accent/40 text-left transition-all group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-accent-light flex-shrink-0 transition-colors" />
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs text-zinc-200 group-hover:text-white font-medium truncate block transition-colors">
                                      {title}
                                    </span>
                                    {subfolder && (
                                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 truncate block flex items-center gap-1 mt-0.5">
                                        <FolderTree className="w-2.5 h-2.5 flex-shrink-0 text-accent-light/60" />
                                        {subfolder}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-accent-light opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                              </button>
                            );
                          })}
                        </div>

                        {/* Action Bar below notes */}
                        <div className="pt-2.5 mt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                          {allNotes.length > 5 && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowAllInline((prev) => ({
                                  ...prev,
                                  [folder.folder]: !prev[folder.folder],
                                }))
                              }
                              className="flex items-center gap-1 text-[11px] font-medium text-accent-light hover:text-white px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors"
                            >
                              {isShowingAll ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Recolher ({allNotes.length})
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Ver todas ({allNotes.length})
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setModalTrail(folder.folder)}
                            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors ml-auto"
                            title="Abrir painel com busca e filtros"
                          >
                            <ExternalLink className="w-3 h-3 text-accent-light" />
                            <span>Abrir painel</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Notes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent-light" />
            Notas Recentes
          </h2>
        </div>

        <div className="space-y-2 stagger-children">
          {overview.recentFiles.slice(0, 8).map((file) => (
            <NotePreview
              key={file.path}
              path={file.path}
              mtime={file.mtime}
              onClick={() => setSelectedNote(file.path)}
            />
          ))}
        </div>
      </section>

      {/* Trail Notes Modal */}
      <TrailNotesModal
        folderName={modalTrail}
        isOpen={!!modalTrail}
        onClose={() => setModalTrail(null)}
        onSelectNote={setSelectedNote}
      />

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
