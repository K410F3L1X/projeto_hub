"use client";

import { FileText, Clock } from "lucide-react";
import { extractTitle, extractFolder, formatRelativeTime, truncateContent } from "@/lib/obsidian-client";

interface NotePreviewProps {
  path: string;
  content?: string;
  mtime?: number;
  onClick?: () => void;
}

export default function NotePreview({ path, content, mtime, onClick }: NotePreviewProps) {
  const title = extractTitle(path);
  const folder = extractFolder(path);

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass glass-hover rounded-xl p-4 group cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent/20 transition-colors">
          <FileText className="w-4 h-4 text-accent-light" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-text-primary truncate group-hover:text-white transition-colors">
              {title}
            </h4>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-accent/10 text-accent-light border border-accent/20">
              {folder}
            </span>
            {mtime && (
              <span className="flex items-center gap-1 text-[11px] text-text-muted">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(mtime)}
              </span>
            )}
          </div>

          {content && (
            <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
              {truncateContent(content, 150)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
