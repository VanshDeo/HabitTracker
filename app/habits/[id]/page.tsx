'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useHabits } from '@/hooks/useHabits';
import { contractGetHabitById, contractIsCheckedInToday } from '@/lib/contract';
import { StreakBadge } from '@/components/StreakBadge';
import { TxToast } from '@/components/TxToast';
import { getStreakReward, STREAK_REWARDS, type Habit } from '@/types';
import {
  ArrowLeft,
  Trophy,
  CheckCircle,
  Repeat2,
  Coins,
  Calendar,
  Loader2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

function StatBlock({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground`}>
        <Icon className={`h-3.5 w-3.5 ${color ?? ''}`} />
        {label}
      </div>
      <p className={`text-2xl font-bold tabular-nums text-foreground ${color ?? ''}`}>
        {value}
      </p>
    </div>
  );
}

export default function HabitDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const habitId = Number(id);

  const { publicKey, isConnected } = useWallet();
  const { txState, checkIn, deactivateHabit, resetTx } = useHabits(publicKey);

  const [habit, setHabit]                   = useState<Habit | null>(null);
  const [isCheckedIn, setIsCheckedIn]       = useState(false);
  const [loading, setLoading]               = useState(true);
  const [notFound, setNotFound]             = useState(false);

  async function load() {
    if (!publicKey) return;
    const [fetched, ci] = await Promise.all([
      contractGetHabitById(publicKey, habitId),
      contractIsCheckedInToday(publicKey, habitId),
    ]);
    if (!fetched) { setNotFound(true); }
    else { setHabit(fetched); setIsCheckedIn(ci); }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Re-load whenever a mutation completes
    window.addEventListener('habits:updated', load);
    return () => window.removeEventListener('habits:updated', load);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const isMutating =
    txState.status !== 'idle' &&
    txState.status !== 'success' &&
    txState.status !== 'failed';

  const currentReward = habit ? getStreakReward(habit.streak) : null;

  // Progress toward next tier
  let progress = 0;
  let nextTierLabel = '';
  let nextTierThreshold = 0;
  if (habit) {
    const currentIdx = STREAK_REWARDS.findIndex((r) => habit.streak >= r.threshold);
    const prevTier = STREAK_REWARDS[currentIdx - 1];
    if (prevTier && currentReward) {
      const from = currentReward.threshold;
      const to   = prevTier.threshold;
      progress           = Math.min(100, Math.round(((habit.streak - from) / (to - from)) * 100));
      nextTierLabel      = prevTier.label;
      nextTierThreshold  = prevTier.threshold;
    }
  }

  // ── States ──────────────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <p className="text-muted-foreground">Connect your wallet to view habit details.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !habit) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <p className="text-muted-foreground">Habit not found or has been removed.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-2xl">
        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Heading */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!habit.isActive && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  Inactive
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat2 className="h-3.5 w-3.5" />
                {habit.frequency}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground text-balance">{habit.name}</h1>
            {habit.description && (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {habit.description}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <StreakBadge streak={habit.streak} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBlock icon={Trophy}       label="Best Streak"    value={habit.longestStreak} color="text-amber-600" />
          <StatBlock icon={CheckCircle}  label="Total Check-ins" value={habit.totalCompletions} color="text-emerald-600" />
          <StatBlock icon={Coins}        label="Reward / check-in" value={`+${currentReward?.reward ?? 1}`} color="text-amber-600" />
          <StatBlock
            icon={Calendar}
            label="Created"
            value={new Date(habit.createdAt * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          />
        </div>

        {/* Progress to next tier */}
        {nextTierLabel && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">Progress to {nextTierLabel} tier</span>
              <span>{habit.streak} / {nextTierThreshold} days</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {nextTierThreshold - habit.streak} more days to unlock{' '}
              <span className="font-semibold text-amber-600">
                +{STREAK_REWARDS.find((r) => r.label === nextTierLabel)?.reward} tokens/check-in
              </span>
            </p>
          </div>
        )}

        {/* Reward tier table */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            Token Reward Tiers
          </h2>
          <div className="space-y-1">
            {[...STREAK_REWARDS].reverse().map((tier) => {
              const isCurrent =
                habit.streak >= tier.threshold &&
                STREAK_REWARDS.find((r) => habit.streak >= r.threshold)?.threshold === tier.threshold;
              return (
                <div
                  key={tier.threshold}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    isCurrent
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className={`font-medium ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                    {tier.label}
                    {isCurrent && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                        Current
                      </span>
                    )}
                  </span>
                  <span className={`tabular-nums font-bold ${isCurrent ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    +{tier.reward} tokens
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {habit.isActive && (
          <div className="flex items-center gap-3">
            {isCheckedIn ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Already checked in today
              </div>
            ) : (
              <button
                onClick={() => checkIn(habit.id)}
                disabled={isMutating}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMutating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="h-4 w-4" />
                )}
                {isMutating ? 'Processing...' : 'Mark Complete'}
              </button>
            )}
          </div>
        )}
      </div>

      <TxToast txState={txState} onDismiss={resetTx} />
    </>
  );
}
