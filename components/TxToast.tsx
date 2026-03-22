'use client';

import { useEffect } from 'react';
import type { TxState } from '@/types';
import { CheckCircle, XCircle, Loader2, PenLine, Send, RefreshCw, Settings } from 'lucide-react';

interface TxToastProps {
  txState: TxState;
  onDismiss: () => void;
}

const STATUS_CONFIG = {
  idle:               null,
  building:           { icon: Settings,     color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',    label: (a: string | null) => `${a ?? 'Processing'}...` },
  awaiting_signature: { icon: PenLine,      color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      label: () => 'Sign in Freighter...' },
  submitting:         { icon: Send,         color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      label: () => 'Submitting...' },
  polling:            { icon: RefreshCw,    color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200',  label: () => 'Confirming on-chain...' },
  success:            { icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200',label: () => 'Done!' },
  failed:             { icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50 border-red-200',        label: (a: string | null) => `Failed: ${a ?? 'Unknown error'}` },
} as const;

export function TxToast({ txState, onDismiss }: TxToastProps) {
  const { status, txHash, error, action, reward } = txState;

  // Auto-dismiss 5 s after success
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [status, onDismiss]);

  if (status === 'idle') return null;

  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  const Icon        = cfg.icon;
  const isSpinning  = status === 'polling';
  const labelText   = status === 'failed'
    ? cfg.label(error)
    : status === 'building'
    ? cfg.label(action)
    : cfg.label(null);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 w-80 rounded-xl border shadow-lg p-4 transition-all ${cfg.bg}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.color} ${isSpinning ? 'animate-spin-slow' : ''}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${cfg.color}`}>{labelText}</p>

          {/* Token reward on success */}
          {status === 'success' && reward != null && reward > 0 && (
            <p className="mt-1 text-sm font-medium text-amber-600">
              +{reward} tokens earned!
            </p>
          )}

          {/* Tx explorer link */}
          {status === 'success' && txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs text-muted-foreground hover:underline truncate"
            >
              {txHash.slice(0, 16)}...{txHash.slice(-8)}
            </a>
          )}

          {/* Dismiss on failure */}
          {status === 'failed' && (
            <button
              onClick={onDismiss}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
