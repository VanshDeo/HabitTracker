'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getStreakReward, STREAK_REWARDS } from '@/types';
import type { Habit } from '@/types';
import { StreakBadge } from './StreakBadge';
import {
  CheckCircle,
  Loader2,
  Trash2,
  Trophy,
  Repeat2,
  Coins,
  ChevronRight,
  X,
} from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  isCheckedInToday: boolean;
  txInFlight: boolean;
  onCheckIn:    (id: number) => Promise<void>;
  onDeactivate: (id: number) => Promise<void>;
}

/** Returns the next reward tier threshold so we can show progress to it. */
function nextTier(streak: number): { threshold: number; reward: number } {
  const idx = STREAK_REWARDS.findIndex((r) => streak >= r.threshold);
  // The tier below the current one in the array is the "next" milestone
  const prevIdx = idx - 1;
  if (prevIdx < 0) {
    // Already at the top tier
    return { threshold: STREAK_REWARDS[0].threshold, reward: STREAK_REWARDS[0].reward };
  }
  return STREAK_REWARDS[prevIdx];
}

export function HabitCard({
  habit,
  isCheckedInToday,
  txInFlight,
  onCheckIn,
  onDeactivate,
}: HabitCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentReward = getStreakReward(habit.streak);
  const next          = nextTier(habit.streak);
  const canCheckIn    = !isCheckedInToday && !txInFlight;

  // Progress bar toward next milestone
  const currentTierIdx = STREAK_REWARDS.findIndex((r) => habit.streak >= r.threshold);
  const prevTier       = STREAK_REWARDS[currentTierIdx - 1];
  let progress = 100;
  if (prevTier) {
    const fromThreshold = currentReward.threshold;
    const toThreshold   = prevTier.threshold;
    progress = Math.min(
      100,
      Math.round(((habit.streak - fromThreshold) / (toThreshold - fromThreshold)) * 100),
    );
  }

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-card-foreground leading-snug text-balance">
              {habit.name}
            </h3>
            {habit.description && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {habit.description}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <StreakBadge streak={habit.streak} />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" />
            Best:{' '}
            <strong className="ml-0.5 text-foreground">{habit.longestStreak}</strong>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Completed:{' '}
            <strong className="ml-0.5 text-foreground">{habit.totalCompletions}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="h-3.5 w-3.5" />
            {habit.frequency}
          </span>
        </div>

        {/* Progress bar toward next tier */}
        {prevTier && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-500" />
                +{currentReward.reward} per check-in
              </span>
              <span>
                {next.threshold - habit.streak} to +{next.reward} tokens
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {!prevTier && (
          <p className="mt-2 text-xs font-semibold text-amber-600 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            Legend tier — max reward +{currentReward.reward} tokens/check-in
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        {/* Check-in button */}
        {isCheckedInToday ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 select-none dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            Done Today
          </div>
        ) : (
          <button
            onClick={() => onCheckIn(habit.id)}
            disabled={!canCheckIn}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {txInFlight ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Coins className="h-4 w-4" />
            )}
            {txInFlight ? 'Processing...' : 'Mark Complete'}
          </button>
        )}

        <div className="flex items-center gap-1">
          {/* Detail link */}
          <Link
            href={`/habits/${habit.id}`}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="View habit details"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>

          {/* Delete / confirm */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDeactivate(habit.id); setConfirmDelete(false); }}
                disabled={txInFlight}
                className="rounded-md px-2 py-1 text-xs font-semibold text-destructive border border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-40"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={txInFlight}
              title="Remove habit"
              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
