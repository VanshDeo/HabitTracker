'use client';

import { getStreakReward } from '@/types';
import type { Habit } from '@/types';
import { StreakBadge } from './StreakBadge';
import { CheckCircle, Loader2, Trash2, Trophy, Repeat2, Coins } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  isCheckedInToday: boolean;
  txInFlight: boolean;
  onCheckIn:    (id: number) => Promise<void>;
  onDeactivate: (id: number) => Promise<void>;
}

export function HabitCard({
  habit,
  isCheckedInToday,
  txInFlight,
  onCheckIn,
  onDeactivate,
}: HabitCardProps) {
  const nextStreak   = habit.streak + 1;
  const nextReward   = getStreakReward(nextStreak).reward;
  const canCheckIn   = !isCheckedInToday && !txInFlight;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-card-foreground leading-snug text-balance">
            {habit.name}
          </h3>
          <div className="shrink-0">
            <StreakBadge streak={habit.streak} />
          </div>
        </div>

        {habit.description && (
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {habit.description}
          </p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" />
            Best: <strong className="ml-0.5 text-foreground">{habit.longestStreak}</strong>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Total: <strong className="ml-0.5 text-foreground">{habit.totalCompletions}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="h-3.5 w-3.5" />
            {habit.frequency}
          </span>
        </div>

        {/* Next reward hint */}
        <p className="mt-2 text-xs text-muted-foreground">
          Next reward:{' '}
          <span className="font-semibold text-amber-600">+{nextReward} tokens</span>
          {' '}at streak {nextStreak}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        {isCheckedInToday ? (
          <button
            disabled
            className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 cursor-not-allowed opacity-90"
          >
            <CheckCircle className="h-4 w-4" />
            Done Today
          </button>
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

        <button
          onClick={() => onDeactivate(habit.id)}
          disabled={txInFlight}
          title="Deactivate habit"
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
    </article>
  );
}
