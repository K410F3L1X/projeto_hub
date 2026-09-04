"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search as SearchIcon,
  Sparkles,
  FileText,
  FolderOpen,
  X,
  ArrowRight,
  Command,
} from "lucide-react";
import NoteModal from "@/components/NoteModal";
import { extractTitle, extractFolder, truncateContent } from "@/lib/obsidian-client";

interface SearchResultItem {
  filename: string;
  score?: number;
  matches?: { match: { start: number; end: number }; context: string }[];
}

const SUGGESTIONS = [
  "Estoicismo",
  "Neuroplasticidade",
  "Psicologia Financeira",
  "Hábitos",
  "Motivação",
  "Gestão de Tempo",
  "Musculação",
  "Programação",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/vault/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (value: string) => {
    setQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    performSearch(query);
  };

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Busca Inteligente</span>
        </h1>
        <p className="text-text-secondary mt-1.5 text-[15px]">
          Pesquise no seu vault de conhecimento —{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle text-[11px] font-mono text-text-muted">
            Ctrl+K
          </kbd>{" "}
          para focar
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="glass rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-accent/30 focus-within:shadow-[0_0_30px_rgba(124,58,237,0.1)]">
          <div className="flex items-center px-5 py-4">
            <SearchIcon className="w-5 h-5 text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Pesquisar no vault..."
              className="flex-1 bg-transparent text-text-primary text-[15px] px-4 focus:outline-none placeholder:text-text-muted/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setHasSearched(false);
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors mr-2"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-overlay border border-border-subtle">
              <Command className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] text-text-muted font-mono">K</span>
            </div>
          </div>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Pesquisando no vault...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">
              {results.length} {results.length === 1 ? "resultado" : "resultados"} para{" "}
              <span className="text-accent-light font-medium">&ldquo;{query}&rdquo;</span>
            </p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-overlay flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-text-muted/50" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-1">Nenhum resultado</h3>
              <p className="text-sm text-text-muted">
                Tente outros termos ou verifique a ortografia
              </p>
            </div>
          ) : (
            <div className="stagger-children space-y-2">
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedNote(result.filename)}
                  className="w-full text-left glass glass-hover rounded-xl p-4 group cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent/20 transition-colors">
                      <FileText className="w-4 h-4 text-accent-light" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-text-primary truncate group-hover:text-white transition-colors">
                          {extractTitle(result.filename)}
                        </h4>
                        <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>

                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-accent/10 text-accent-light border border-accent/20">
                          <FolderOpen className="w-2.5 h-2.5" />
                          {extractFolder(result.filename)}
                        </span>
                        {result.score !== undefined && (
                          <span className="text-[10px] text-text-muted">
                            relevância: {Math.round(result.score * 100)}%
                          </span>
                        )}
                      </div>

                      {result.matches && result.matches.length > 0 && (
                        <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                          {truncateContent(result.matches[0].context, 200)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State — Suggestions */}
      {!loading && !hasSearched && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-5 opacity-80">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Explore o seu vault
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Pesquise por conceitos, notas de aulas, resumos de livros, ou qualquer ideia capturada no seu Segundo Cérebro
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-muted mb-3 text-center">
              Sugestões de busca
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    performSearch(suggestion);
                  }}
                  className="px-4 py-2 glass rounded-full text-sm text-text-secondary hover:text-text-primary hover:bg-accent/10 hover:border-accent/20 transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
