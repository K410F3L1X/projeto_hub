"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Sparkles,
  FolderOpen,
  ChevronDown,
  Check,
  Zap,
  Clock,
  FileText,
  FileUp,
  PenLine,
  Loader2,
  RotateCcw,
} from "lucide-react";
import NoteModal from "@/components/NoteModal";
import PdfUploader from "@/components/PdfUploader";
import LinkSelector from "@/components/LinkSelector";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RecentInboxNote {
  path: string;
  title: string;
  folder: string;
  timestamp: number;
}

const FOLDERS = [
  "Conceitos e Definições",
  "Reservatorio de Dopamina",
  "Biblioteca",
  "Pessoas e Entidades",
  "Faculdade",
  "Programação",
  "Python",
  "Comunicação",
  "Inglês",
  "Pensamentos",
];

type InboxTab = "text" | "pdf";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<InboxTab>("text");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(FOLDERS[0]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recentNotes, setRecentNotes] = useState<RecentInboxNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  // AI summarization state
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiTitle, setAiTitle] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const folderPickerRef = useRef<HTMLDivElement>(null);

  // Auto-generate title from content
  useEffect(() => {
    if (aiTitle) return; // Don't override AI-generated title
    if (!content.trim()) {
      setTitle("");
      return;
    }
    const firstLine = content.split("\n")[0].trim();
    const autoTitle = firstLine.length > 60 ? firstLine.substring(0, 60) + "…" : firstLine;
    setTitle(autoTitle);
  }, [content, aiTitle]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  const insertLink = (link: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textToInsert = `[[${link}]]`;
    
    const newContent =
      content.substring(0, start) +
      textToInsert +
      content.substring(end);
      
    setContent(newContent);
    setAiPreview(null);
    setAiTitle(null);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 10);
  };

  // Close folder picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setShowFolderPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSave = useCallback(async () => {
    const textToSave = aiPreview || content;
    const titleToSave = aiTitle || title;
    if (!textToSave.trim() || !titleToSave.trim() || saving) return;

    setSaving(true);
    const sanitizedTitle = titleToSave.replace(/[\\/:*?"<>|]/g, "").trim();
    const path = `${selectedFolder}/${sanitizedTitle}.md`;

    try {
      const res = await fetch("/api/vault/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: textToSave }),
      });

      if (res.ok) {
        setSaved(true);
        setRecentNotes((prev) => [
          { path, title: sanitizedTitle, folder: selectedFolder, timestamp: Date.now() },
          ...prev.slice(0, 4),
        ]);
        setTimeout(() => {
          setContent("");
          setTitle("");
          setAiPreview(null);
          setAiTitle(null);
          setSaved(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }, [content, title, aiPreview, aiTitle, selectedFolder, saving]);

  // AI Summarize current text
  const handleAiSummarize = useCallback(async () => {
    if (!content.trim() || aiSummarizing) return;

    setAiSummarizing(true);
    setPdfError(null);

    try {
      const res = await fetch("/api/vault/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar resumo");
      }

      setAiPreview(data.summary);
      setAiTitle(data.title);
      setContent(data.summary);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setAiSummarizing(false);
    }
  }, [content, aiSummarizing]);

  // PDF result handler
  const handlePdfResult = useCallback(
    (result: { title: string; summary: string; extractedLength: number }) => {
      setAiPreview(result.summary);
      setAiTitle(result.title);
      setTitle(result.title);
      setContent(result.summary);
      setPdfError(null);
    },
    []
  );

  // Keyboard shortcut: Ctrl+Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const resetAll = () => {
    setContent("");
    setTitle("");
    setAiPreview(null);
    setAiTitle(null);
    setPdfError(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="gradient-text">Inbox</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20">
            <Zap className="w-3.5 h-3.5 text-accent-light" />
          </span>
        </h1>
        <p className="text-text-secondary mt-1.5 text-[15px]">
          Capture ideias ou importe PDFs — salve direto no vault com{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle text-[11px] font-mono text-text-muted">
            Ctrl+Enter
          </kbd>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 glass rounded-xl w-fit">
            <button
              onClick={() => { setActiveTab("text"); resetAll(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "text"
                  ? "bg-accent/15 text-accent-light border border-accent/20"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-overlay/50"
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Texto
            </button>
            <button
              onClick={() => { setActiveTab("pdf"); resetAll(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "pdf"
                  ? "bg-accent/15 text-accent-light border border-accent/20"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-overlay/50"
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              PDF Upload
            </button>
          </div>

          {/* TEXT TAB */}
          {activeTab === "text" && (
            <>
              {/* Title Input */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border-subtle">
                  <Sparkles className="w-4 h-4 text-accent-light" />
                  <input
                    type="text"
                    value={aiTitle || title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setAiTitle(null);
                    }}
                    placeholder="Título (auto-gerado a partir do conteúdo)"
                    className="flex-1 bg-transparent text-text-primary text-[15px] font-medium placeholder:text-text-muted focus:outline-none"
                  />
                </div>

                {/* Content Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setAiPreview(null);
                    setAiTitle(null);
                  }}
                  placeholder={`Capture um pensamento, nota, ou ideia...\n\nSuporta Markdown. Use [[links]] para criar conexões.`}
                  className="w-full min-h-[200px] bg-transparent text-text-primary text-[15px] leading-relaxed px-5 py-4 resize-none focus:outline-none placeholder:text-text-muted/60"
                />
              </div>

              {/* AI Preview */}
              {aiPreview && (
                <div className="glass rounded-xl p-4 border border-violet-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-semibold text-violet-300">Resumo gerado pela IA</span>
                    </div>
                    <button
                      onClick={resetAll}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                  <div className="prose-vault text-sm max-h-[300px] overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiPreview.substring(0, 500) + (aiPreview.length > 500 ? "\n\n*…preview truncado*" : "")}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PDF TAB */}
          {activeTab === "pdf" && (
            <>
              <PdfUploader
                onResult={handlePdfResult}
                onError={(err) => setPdfError(err)}
              />

              {/* PDF Error */}
              {pdfError && (
                <div className="glass rounded-xl p-4 border border-red-500/20 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400">Erro</p>
                    <p className="text-xs text-text-muted mt-0.5">{pdfError}</p>
                  </div>
                </div>
              )}

              {/* PDF AI Result Preview */}
              {aiPreview && (
                <div className="glass rounded-xl overflow-hidden border border-violet-500/20">
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-border-subtle">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <input
                      type="text"
                      value={aiTitle || title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setAiTitle(e.target.value);
                      }}
                      className="flex-1 bg-transparent text-text-primary text-[15px] font-medium placeholder:text-text-muted focus:outline-none"
                    />
                  </div>
                  <div className="p-5 prose-vault text-sm max-h-[400px] overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiPreview}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Folder Picker */}
            <div className="relative" ref={folderPickerRef}>
              <button
                onClick={() => setShowFolderPicker(!showFolderPicker)}
                className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl hover:bg-surface-overlay transition-colors text-sm"
              >
                <FolderOpen className="w-4 h-4 text-accent-light" />
                <span className="text-text-secondary">{selectedFolder}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${showFolderPicker ? "rotate-180" : ""}`} />
              </button>

              {showFolderPicker && (
                <div className="absolute bottom-full mb-2 left-0 w-64 glass rounded-xl border border-border overflow-hidden shadow-2xl animate-slide-up z-50">
                  <div className="p-2 max-h-[300px] overflow-y-auto">
                    {FOLDERS.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => {
                          setSelectedFolder(folder);
                          setShowFolderPicker(false);
                        }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedFolder === folder
                            ? "bg-accent/12 text-accent-light"
                            : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{folder}</span>
                        {selectedFolder === folder && <Check className="w-3.5 h-3.5 ml-auto text-accent-light" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {activeTab === "text" && (
                <LinkSelector onSelect={insertLink} className="mr-2" />
              )}
              {/* AI Summarize Button (text tab only) */}
              {activeTab === "text" && content.trim() && !aiPreview && (
                <button
                  onClick={handleAiSummarize}
                  disabled={aiSummarizing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-all disabled:opacity-50"
                >
                  {aiSummarizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resumindo…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Resumir com IA
                    </>
                  )}
                </button>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!(aiPreview || content.trim()) || !(aiTitle || title.trim()) || saving}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-300
                  ${
                    saved
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : (aiPreview || content.trim()) && (aiTitle || title.trim())
                      ? "gradient-accent text-white hover:opacity-90 glow-accent"
                      : "bg-surface-overlay text-text-muted border border-border-subtle cursor-not-allowed"
                  }
                `}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Salvo!
                  </>
                ) : saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Salvar no Vault
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar — Recent inbox notes + tips */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent-light" />
              Notas Recentes do Inbox
            </h3>

            {recentNotes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-accent-light/50" />
                </div>
                <p className="text-sm text-text-muted">
                  Nenhuma nota criada ainda nesta sessão
                </p>
                <p className="text-xs text-text-muted/60 mt-1">
                  Use o formulário ao lado para capturar ideias
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotes.map((note, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedNote(note.path)}
                    className="w-full text-left flex items-start gap-2.5 p-3 rounded-lg hover:bg-surface-overlay transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-accent-light/60 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate group-hover:text-white transition-colors">
                        {note.title}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">{note.folder}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div className="glass rounded-xl p-5 border-accent/10">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent-light" />
              Dicas
            </h3>
            <ul className="space-y-2.5 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-accent-light">•</span>
                Use <code className="px-1 py-0.5 rounded bg-accent/10 text-accent-light text-[10px]">[[links]]</code> para conectar ideias
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light">•</span>
                O título é auto-gerado da primeira linha
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light">•</span>
                <kbd className="px-1 py-0.5 rounded bg-surface-overlay border border-border-subtle text-[10px] font-mono">Ctrl+Enter</kbd> para salvar rápido
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400">•</span>
                Aba <strong className="text-violet-300">PDF Upload</strong> extrai e resume com IA
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400">•</span>
                Botão <strong className="text-violet-300">✨ Resumir com IA</strong> gera resumos de textos longos
              </li>
            </ul>
          </div>
        </div>
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
