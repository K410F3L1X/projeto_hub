"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Inbox, LayoutDashboard, Search, Brain, Wifi, WifiOff, Folder } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox, description: "Captura rápida" },
  { href: "/vault", label: "Cofre", icon: Folder, description: "Gerenciador de Notas" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Segundo Cérebro" },
  { href: "/search", label: "Busca", icon: Search, description: "Busca Inteligente" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [obsidianStatus, setObsidianStatus] = useState<"connected" | "disconnected" | "checking">("checking");

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch("/api/vault/notes");
        setObsidianStatus(res.ok ? "connected" : "disconnected");
      } catch {
        setObsidianStatus("disconnected");
      }
    }
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] flex flex-col border-r border-border-subtle bg-surface-raised/80 backdrop-blur-xl z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              Study Hub
            </h1>
            <p className="text-[11px] text-text-muted font-medium tracking-wide uppercase">
              Segundo Cérebro
            </p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-border-subtle" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? "bg-accent/12 text-accent-light"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full gradient-accent" />
              )}
              
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
                isActive ? "text-accent-light" : "text-text-muted group-hover:text-text-secondary"
              }`} />
              
              <div className="flex flex-col">
                <span>{item.label}</span>
                <span className={`text-[10px] font-normal transition-colors duration-200 ${
                  isActive ? "text-accent-light/60" : "text-text-muted"
                }`}>
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="px-4 py-3 border-t border-border-subtle">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          {obsidianStatus === "connected" ? (
            <>
              <div className="relative">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <span className="text-xs text-emerald-400 font-medium">Obsidian conectado</span>
            </>
          ) : obsidianStatus === "disconnected" ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-medium">Obsidian offline</span>
            </>
          ) : (
            <>
              <div className="w-3.5 h-3.5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-text-muted font-medium">Verificando...</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
