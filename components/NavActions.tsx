'use client';

import { ConnectWallet } from './ConnectWallet';
import { TokenBalance } from './TokenBalance';
import { useWallet } from '@/hooks/useWallet';
import { contractGetUserStats } from '@/lib/contract';
import { useEffect, useState } from 'react';

/**
 * NavActions — client component that renders ConnectWallet + TokenBalance in the nav.
 * Separately fetches token balance so it updates after each check-in.
 */
export function NavActions() {
  const { publicKey, isConnected } = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!publicKey) { setBalance(0); return; }
    contractGetUserStats(publicKey).then((s) => setBalance(s.tokenBalance)).catch(() => {});
  }, [publicKey]);

  return (
    <div className="flex items-center gap-3">
      {isConnected && <TokenBalance balance={balance} />}
      <ConnectWallet />
    </div>
  );
}
