"use client";

import { X, Copy, Check, Edit2, Save, RotateCcw } from "lucide-react";
import { extractTitle, extractFolder } from "@/lib/obsidian-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect, useCallback, useRef } from "react";
import LinkSelector from "./LinkSelector";

interface NoteModalProps {
  path: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NoteModal({ path, isOpen, onClose }: NoteModalProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const title = extractTitle(path);
  const folder = extractFolder(path);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchNote = useCallback(() => {
    if (!path) return;
    setLoading(true);
    fetch(`/api/vault/note?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content || "");
        setEditContent(data.content || "");
        setLoading(false);
      })
      .catch(() => {
        setContent("Erro ao carregar nota.");
        setLoading(false);
      });
  }, [path]);

  useEffect(() => {
    if (isOpen) {
      fetchNote();
      setIsEditing(false);
    }
  }, [isOpen, fetchNote]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isEditing) onClose();
    },
    [onClose, isEditing]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vault/note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: editContent }),
      });
      if (res.ok) {
        setContent(editContent);
        setIsEditing(false);
      } else {
        alert("Erro ao guardar as alterações.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao tentar guardar.");
    } finally {
      setSaving(false);
    }
  };

  // Auto-resize textarea in edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(300, textareaRef.current.scrollHeight)}px`;
    }
  }, [isEditing, editContent]);

  const insertLink = (link: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textToInsert = `[[${link}]]`;
    
    const newContent =
      editContent.substring(0, start) +
      textToInsert +
      editContent.substring(end);
      
    setEditContent(newContent);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 10);
  };

  // Clean obsidian-specific syntax for react-markdown
  const cleanContent = content
    .replace(/```ad-\w+[\s\S]*?```/g, (match) => {
      const lines = match.split("\n");
      const contentLines = lines.slice(1, -1).filter((l) => !l.startsWith("title:") && !l.startsWith("collapse:"));
      return contentLines.join("\n");
    })
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, link, alias) => `**${alias || link}**`);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => !isEditing && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] glass rounded-2xl border border-border overflow-hidden animate-slide-up shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-raised/60 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-accent/10 text-accent-light border border-accent/20">
              {folder}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <LinkSelector onSelect={insertLink} />
                <button
                  onClick={() => {
                    setEditContent(content);
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg text-violet-300 hover:text-violet-200 hover:bg-violet-500/15 transition-colors"
                  title="Editar nota"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg text-text-muted hover:bg-surface-overlay hover:text-text-primary transition-colors"
                  title="Copiar conteúdo"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-text-muted hover:bg-surface-overlay hover:text-text-primary transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-surface-base">
          {loading ? (
            <div className="flex items-center justify-center py-16 h-full">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEditing ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full min-h-[500px] bg-transparent text-text-primary text-[15px] font-mono leading-relaxed resize-none focus:outline-none placeholder:text-text-muted/60"
              spellCheck={false}
            />
          ) : (
            <div className="prose-vault max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {cleanContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
