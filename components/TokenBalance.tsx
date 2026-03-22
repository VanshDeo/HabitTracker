'use client';

import { Coins } from 'lucide-react';

interface TokenBalanceProps {
  balance: number;
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  return (
    <div
      title="Earn more by maintaining streaks!"
      className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 cursor-default select-none"
    >
      <Coins className="h-4 w-4 text-amber-500" />
      <span className="tabular-nums">{balance}</span>
      <span className="text-amber-500 font-normal">HABIT</span>
    </div>
  );
}
