"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface PdfUploaderProps {
  onResult: (result: { title: string; summary: string; extractedLength: number }) => void;
  onError: (error: string) => void;
}

type UploadStatus = "idle" | "extracting" | "summarizing" | "done" | "error";

const STATUS_LABELS: Record<UploadStatus, string> = {
  idle: "Solte um PDF aqui ou clique para selecionar",
  extracting: "Extraindo texto do PDF…",
  summarizing: "Gerando resumo com IA…",
  done: "Resumo gerado com sucesso!",
  error: "Erro ao processar o ficheiro",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function PdfUploader({ onResult, onError }: PdfUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = useCallback(
    async (file: File) => {
      // Validate
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        onError("Apenas ficheiros PDF são suportados.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        onError(`Ficheiro muito grande. Limite: ${formatFileSize(MAX_FILE_SIZE)}`);
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setStatus("extracting");
      setProgress(30);

      try {
        const formData = new FormData();
        formData.append("file", file);

        setStatus("summarizing");
        setProgress(60);

        const res = await fetch("/api/vault/ingest", {
          method: "POST",
          body: formData,
        });

        setProgress(90);

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro desconhecido");
        }

        setStatus("done");
        setProgress(100);
        onResult(data);
      } catch (err) {
        setStatus("error");
        setProgress(0);
        onError(err instanceof Error ? err.message : "Erro ao processar PDF");
      }
    },
    [onResult, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const reset = () => {
    setStatus("idle");
    setFileName(null);
    setFileSize(0);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => status === "idle" && fileInputRef.current?.click()}
        className={`
          relative glass rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${
            isDragging
              ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
              : status === "idle"
              ? "border-border-subtle hover:border-violet-400/50 hover:bg-surface-overlay/50"
              : status === "error"
              ? "border-red-500/50 bg-red-500/5"
              : status === "done"
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-violet-400/30 bg-violet-500/5"
          }
        `}
      >
        <div className="flex flex-col items-center justify-center py-12 px-6">
          {/* Icon */}
          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
              ${
                isDragging
                  ? "bg-violet-500/20 scale-110"
                  : status === "error"
                  ? "bg-red-500/20"
                  : status === "done"
                  ? "bg-emerald-500/20"
                  : status === "idle"
                  ? "bg-accent/10"
                  : "bg-violet-500/15"
              }
            `}
          >
            {status === "idle" && <Upload className={`w-6 h-6 ${isDragging ? "text-violet-300 animate-bounce" : "text-accent-light"}`} />}
            {(status === "extracting" || status === "summarizing") && (
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            )}
            {status === "done" && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
            {status === "error" && <AlertCircle className="w-6 h-6 text-red-400" />}
          </div>

          {/* Status Label */}
          <p
            className={`text-sm font-medium mb-1 ${
              status === "error" ? "text-red-400" : status === "done" ? "text-emerald-400" : "text-text-primary"
            }`}
          >
            {STATUS_LABELS[status]}
          </p>

          {/* File info */}
          {fileName && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-surface-overlay/60">
              <FileText className="w-3.5 h-3.5 text-accent-light" />
              <span className="text-xs text-text-secondary truncate max-w-[200px]">{fileName}</span>
              <span className="text-[10px] text-text-muted">({formatFileSize(fileSize)})</span>
              {(status === "idle" || status === "done" || status === "error") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-text-muted" />
                </button>
              )}
            </div>
          )}

          {/* Accepted formats hint */}
          {status === "idle" && !fileName && (
            <p className="text-[11px] text-text-muted mt-2">
              PDF • Até 20MB
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {progress > 0 && status !== "idle" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-overlay rounded-b-xl overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-b-xl ${
                status === "error" ? "bg-red-500" : status === "done" ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-purple-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
