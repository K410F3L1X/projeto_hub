import { useState, useEffect, useRef } from "react";
import { Link2, Search, FileText } from "lucide-react";

interface LinkSelectorProps {
  onSelect: (link: string) => void;
  className?: string;
}

export default function LinkSelector({ onSelect, className = "" }: LinkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && files.length === 0) {
      setLoading(true);
      fetch("/api/vault/files")
        .then((res) => res.json())
        .then((data) => {
          const flatFiles: string[] = [];
          Object.values(data.files || {}).forEach((folderFiles: any) => {
            flatFiles.push(...folderFiles.map((f: string) => f.replace(/\.md$/, "")));
          });
          setFiles(flatFiles);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, files.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredFiles = files.filter(f => f.toLowerCase().includes(search.toLowerCase())).slice(0, 50);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
        title="Inserir Link para outra Nota"
      >
        <Link2 className="w-3.5 h-3.5" />
        Inserir Link
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 glass rounded-xl border border-border overflow-hidden shadow-2xl z-50 animate-slide-up">
          <div className="p-2 border-b border-border-subtle flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted ml-1" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Pesquisar nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-text-muted">Carregando...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">Nenhuma nota encontrada.</div>
            ) : (
              filteredFiles.map((file) => (
                <button
                  key={file}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(file);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-raised transition-colors group"
                >
                  <FileText className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-light" />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary truncate">
                    {file}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
