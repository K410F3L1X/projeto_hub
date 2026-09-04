"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: string;
  accentColor?: string;
}

export default function StatCard({ icon: Icon, value, label, trend, accentColor }: StatCardProps) {
  return (
    <div className="glass glass-hover rounded-2xl p-5 relative overflow-hidden group">
      {/* Subtle gradient glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${accentColor || "rgba(124,58,237,0.08)"}, transparent 70%)`,
        }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
          <p className="text-sm text-text-secondary mt-1 font-medium">{label}</p>
          {trend && (
            <p className="text-xs text-accent-light mt-2 font-medium">{trend}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent-light" />
        </div>
      </div>
    </div>
  );
}
