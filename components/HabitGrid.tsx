'use client';

import Link from 'next/link';
import type { Habit, TxState } from '@/types';
import { HabitCard } from './HabitCard';
import { PlusCircle } from 'lucide-react';

interface HabitGridProps {
  habits:        Habit[];
  checkedInMap:  Record<number, boolean>;
  txState:       TxState;
  activeHabitId: number | null;
  loading:       boolean;
  onCheckIn:     (id: number) => Promise<void>;
  onDeactivate:  (id: number) => Promise<void>;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-2/3 rounded bg-muted" />
        <div className="h-12 w-16 rounded-xl bg-muted" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
      </div>
      <div className="mt-4 h-9 w-36 rounded-lg bg-muted" />
    </div>
  );
}

export function HabitGrid({
  habits,
  checkedInMap,
  txState,
  activeHabitId,
  loading,
  onCheckIn,
  onDeactivate,
}: HabitGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <span className="text-4xl mb-3 select-none" aria-hidden>🎯</span>
        <h3 className="text-lg font-semibold text-foreground">No habits yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first habit and start earning tokens.
        </p>
        <Link
          href="/habits/new"
          className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create First Habit
        </Link>
      </div>
    );
  }

  const isMutating = txState.status !== 'idle' && txState.status !== 'success' && txState.status !== 'failed';

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          isCheckedInToday={checkedInMap[habit.id] ?? false}
          txInFlight={isMutating && activeHabitId === habit.id}
          onCheckIn={onCheckIn}
          onDeactivate={onDeactivate}
        />
      ))}
    </div>
  );
}
