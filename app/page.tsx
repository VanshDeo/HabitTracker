'use client';

import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useHabits } from '@/hooks/useHabits';
import { HabitGrid } from '@/components/HabitGrid';
import { TxToast } from '@/components/TxToast';
import { ConnectWallet } from '@/components/ConnectWallet';
import { INITIAL_TX_STATE } from '@/types';
import { PlusCircle, LayoutDashboard, CheckCircle, Coins, AlertTriangle } from 'lucide-react';
import { truncateAddress } from '@/lib/wallet';
import { useCallback } from 'react';

export default function DashboardPage() {
  const { publicKey, isConnected, isCorrectNetwork } = useWallet();

  const {
    habits,
    stats,
    loading,
    txState,
    checkedInMap,
    activeHabitId,
    checkIn,
    deactivateHabit,
    refresh,
  } = useHabits(publicKey);

  const handleDismiss = useCallback(() => {
    // Triggers after 5 s auto-dismiss or manual close on failure
    refresh();
  }, [refresh]);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <span className="text-5xl select-none" aria-hidden>🎯</span>
          <h1 className="mt-4 text-2xl font-bold text-foreground text-balance">
            Stellar Habits
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Track daily habits on-chain and earn HABIT tokens for every streak
            milestone — powered by Stellar Soroban smart contracts.
          </p>
          <div className="mt-6 flex justify-center">
            <ConnectWallet />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Requires{' '}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Freighter wallet
            </a>{' '}
            browser extension set to <strong>Testnet</strong>.
          </p>
        </div>
      </div>
    );
  }

  // ── Wrong network warning banner ───────────────────────────────────────────
  const wrongNetworkBanner = !isCorrectNetwork && (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
      <span>
        Wrong network detected. Switch to <strong>Stellar Testnet</strong> in Freighter to interact.
      </span>
    </div>
  );

  // ── Stats row ──────────────────────────────────────────────────────────────
  const statCards = [
    {
      icon: LayoutDashboard,
      label: 'Active Habits',
      value: stats?.totalHabits ?? habits.length,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: CheckCircle,
      label: 'Total Check-ins',
      value: stats?.totalCheckIns ?? 0,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Coins,
      label: 'HABIT Tokens',
      value: stats?.tokenBalance ?? 0,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <>
      {wrongNetworkBanner}

      {/* Welcome heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground text-balance">
          Welcome, {truncateAddress(publicKey!)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your Habit Dashboard</p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Today&apos;s Habits</h2>
        <Link
          href="/habits/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Habit
        </Link>
      </div>

      {/* Habit grid */}
      <HabitGrid
        habits={habits}
        checkedInMap={checkedInMap}
        txState={txState}
        activeHabitId={activeHabitId}
        loading={loading}
        onCheckIn={checkIn}
        onDeactivate={deactivateHabit}
      />

      {/* Transaction toast — fixed position */}
      <TxToast txState={txState} onDismiss={handleDismiss} />
    </>
  );
}
