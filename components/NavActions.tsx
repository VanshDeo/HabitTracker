'use client';

import { ConnectWallet } from './ConnectWallet';
import { TokenBalance } from './TokenBalance';
import { useWallet } from '@/hooks/useWallet';
import { contractGetUserStats } from '@/lib/contract';
import { useEffect, useState, useCallback } from 'react';

/**
 * NavActions — shows the connected wallet address + live token balance.
 * The balance is re-fetched:
 *   1. On mount / whenever publicKey changes.
 *   2. Whenever a "habits:updated" CustomEvent fires (dispatched by useHabits
 *      after every successful mutation).
 */
export function NavActions() {
  const { publicKey, isConnected } = useWallet();
  const [balance, setBalance] = useState(0);

  const fetchBalance = useCallback(() => {
    if (!publicKey) { setBalance(0); return; }
    contractGetUserStats(publicKey)
      .then((s) => setBalance(s.tokenBalance))
      .catch(() => {});
  }, [publicKey]);

  // Fetch on mount / publicKey change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Re-fetch whenever a habit mutation completes
  useEffect(() => {
    window.addEventListener('habits:updated', fetchBalance);
    return () => window.removeEventListener('habits:updated', fetchBalance);
  }, [fetchBalance]);

  return (
    <div className="flex items-center gap-3">
      {isConnected && <TokenBalance balance={balance} />}
      <ConnectWallet />
    </div>
  );
}
