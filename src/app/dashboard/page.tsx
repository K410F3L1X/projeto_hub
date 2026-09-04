"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  FolderOpen,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import TrailCard from "@/components/TrailCard";
import NotePreview from "@/components/NotePreview";
import NoteModal from "@/components/NoteModal";

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
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

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
      try {
        const res = await fetch(`/api/vault/notes?directory=${encodeURIComponent(folderName)}`);
        const data = await res.json();
        setFolderNotes((prev) => ({ ...prev, [folderName]: data.files || [] }));
      } catch {
        setFolderNotes((prev) => ({ ...prev, [folderName]: [] }));
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
          {overview.topFolders.map((folder) => (
            <div key={folder.folder}>
              <TrailCard
                name={folder.folder}
                noteCount={folder.count}
                onClick={() => handleTrailClick(folder.folder)}
              />

              {/* Expanded folder notes */}
              {expandedFolder === folder.folder && folderNotes[folder.folder] && (
                <div className="mt-2 ml-3 space-y-1.5 animate-slide-up">
                  {folderNotes[folder.folder].slice(0, 5).map((notePath) => (
                    <button
                      key={notePath}
                      onClick={() => setSelectedNote(notePath)}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-surface-overlay transition-colors group"
                    >
                      <FileText className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-light transition-colors" />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary truncate transition-colors">
                        {notePath.split("/").pop()?.replace(".md", "")}
                      </span>
                      <ArrowRight className="w-3 h-3 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {folderNotes[folder.folder].length > 5 && (
                    <p className="text-xs text-text-muted px-3 py-1">
                      +{folderNotes[folder.folder].length - 5} mais notas
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
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
