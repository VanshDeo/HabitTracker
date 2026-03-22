'use client';

import { useWallet } from '@/hooks/useWallet';
import { truncateAddress } from '@/lib/wallet';
import { Wallet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function isFreighterInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).freighter;
}

export function ConnectWallet() {
  const { publicKey, isConnected, isCorrectNetwork, connect, disconnect } = useWallet();

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        <Wallet className="h-4 w-4" />
        {isFreighterInstalled() ? 'Connect Freighter' : 'Demo Mode — Connect'}
      </Button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-50/10 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Switch to Stellar Testnet in Freighter
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-mono text-foreground">
        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
        {truncateAddress(publicKey!)}
      </div>
      <button
        onClick={disconnect}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
