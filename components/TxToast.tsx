'use client';

import { useEffect } from 'react';
import type { TxState } from '@/types';
import {
  CheckCircle,
  XCircle,
  Loader2,
  PenLine,
  Send,
  RefreshCw,
  Settings,
  ExternalLink,
} from 'lucide-react';

interface TxToastProps {
  txState: TxState;
  onDismiss: () => void;
}

type StatusKey = Exclude<TxState['status'], 'idle'>;

const STATUS_CONFIG: Record<
  StatusKey,
  {
    icon: React.ElementType;
    spinning?: boolean;
    label: (action: string | null, error: string | null) => string;
    className: string;
    iconClass: string;
  }
> = {
  building: {
    icon: Settings,
    label: (a) => `${a ?? 'Processing'}...`,
    className: 'bg-card border-border text-foreground',
    iconClass: 'text-muted-foreground',
  },
  awaiting_signature: {
    icon: PenLine,
    label: () => 'Waiting for Freighter signature...',
    className: 'bg-card border-primary/30 text-foreground',
    iconClass: 'text-primary',
  },
  submitting: {
    icon: Send,
    label: () => 'Submitting to Stellar network...',
    className: 'bg-card border-primary/30 text-foreground',
    iconClass: 'text-primary',
  },
  polling: {
    icon: RefreshCw,
    spinning: true,
    label: () => 'Confirming on-chain...',
    className: 'bg-card border-primary/30 text-foreground',
    iconClass: 'text-primary',
  },
  success: {
    icon: CheckCircle,
    label: () => 'Transaction confirmed!',
    className: 'bg-card border-emerald-500/30 text-foreground',
    iconClass: 'text-emerald-600',
  },
  failed: {
    icon: XCircle,
    label: (_, e) => `Failed: ${e ?? 'Unknown error'}`,
    className: 'bg-card border-destructive/30 text-foreground',
    iconClass: 'text-destructive',
  },
};

export function TxToast({ txState, onDismiss }: TxToastProps) {
  const { status, txHash, error, action, reward } = txState;

  // Auto-dismiss 5 s after success
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [status, onDismiss]);

  if (status === 'idle') return null;

  const cfg = STATUS_CONFIG[status as StatusKey];
  if (!cfg) return null;

  const Icon      = cfg.icon;
  const labelText = cfg.label(action, error);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 w-80 rounded-xl border shadow-xl p-4 transition-all ${cfg.className}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.iconClass} ${cfg.spinning ? 'animate-spin-slow' : ''}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{labelText}</p>

          {/* Token reward on success */}
          {status === 'success' && reward != null && reward > 0 && (
            <p className="mt-1 text-sm font-bold text-amber-600">
              +{reward} HABIT tokens earned!
            </p>
          )}

          {/* Tx explorer link on success */}
          {status === 'success' && txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline truncate"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              {txHash.slice(0, 14)}...{txHash.slice(-8)}
            </a>
          )}

          {/* Dismiss on failure */}
          {status === 'failed' && (
            <button
              onClick={onDismiss}
              className="mt-2 text-xs text-destructive hover:underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator for in-flight statuses */}
      {status !== 'success' && status !== 'failed' && (
        <div className="mt-3 h-0.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}
