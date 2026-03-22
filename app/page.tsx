'use client';

import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useHabits } from '@/hooks/useHabits';
import { HabitGrid } from '@/components/HabitGrid';
import { TxToast } from '@/components/TxToast';
import { ConnectWallet } from '@/components/ConnectWallet';
import {
  PlusCircle,
  LayoutDashboard,
  CheckCircle,
  Coins,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { truncateAddress } from '@/lib/wallet';

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
    resetTx,
  } = useHabits(publicKey);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Target className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">
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
            Requires the{' '}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Freighter wallet
            </a>{' '}
            extension set to <strong>Testnet</strong>.
          </p>
        </div>
      </div>
    );
  }

  // ── Wrong network warning ──────────────────────────────────────────────────
  const wrongNetworkBanner = !isCorrectNetwork && (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
      <span>
        Wrong network detected. Switch to{' '}
        <strong>Stellar Testnet</strong> in Freighter to interact.
      </span>
    </div>
  );

  // ── Stats cards ────────────────────────────────────────────────────────────
  const statCards = [
    {
      icon: LayoutDashboard,
      label: 'Active Habits',
      value: stats?.totalHabits ?? habits.length,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      icon: CheckCircle,
      label: 'Total Check-ins',
      value: stats?.totalCheckIns ?? 0,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      icon: Coins,
      label: 'HABIT Tokens',
      value: stats?.tokenBalance ?? 0,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
  ];

  return (
    <>
      {wrongNetworkBanner}

      {/* Page heading */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            Welcome back,{' '}
            <span className="font-mono text-primary">{truncateAddress(publicKey!)}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your on-chain habit dashboard</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map(({ icon: Icon, label, value, iconColor, iconBg }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
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
        <h2 className="text-lg font-bold text-foreground">{"Today's Habits"}</h2>
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

      {/* Transaction status toast */}
      <TxToast txState={txState} onDismiss={resetTx} />
    </>
  );
}
