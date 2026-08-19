import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-emerald-400" />
      </div>
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-500 mt-1 max-w-[340px]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-zinc-200 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 id="confirm-title" className="text-base font-bold text-zinc-900">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} className="p-1 text-zinc-500 hover:text-zinc-900" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="df-btn df-btn-ghost">Cancel</button>
          <button type="button" onClick={onConfirm} className="df-btn bg-red-600 hover:bg-red-500 text-white border border-red-400/20">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function severityBadge(level: string) {
  const key = level.toUpperCase();
  if (key === 'CRITICAL') return 'bg-red-600 text-white';
  if (key === 'HIGH') return 'bg-red-50 text-red-700 border border-red-200';
  if (key === 'MEDIUM') return 'bg-amber-50 text-amber-800 border border-amber-200';
  return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
}
