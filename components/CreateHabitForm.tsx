'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { STREAK_REWARDS, INITIAL_TX_STATE } from '@/types';
import type { Frequency, TxState } from '@/types';
import { TxToast } from './TxToast';
import { Loader2, Coins } from 'lucide-react';

interface CreateHabitFormProps {
  onCreateHabit: (
    name: string,
    description: string,
    frequency: Frequency,
  ) => Promise<void>;
  txState:   TxState;
  onDismiss: () => void;
}

export function CreateHabitForm({ onCreateHabit, txState, onDismiss }: CreateHabitFormProps) {
  const router = useRouter();
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [frequency,   setFrequency]   = useState<Frequency>('Daily');

  const isMutating =
    txState.status !== 'idle' &&
    txState.status !== 'success' &&
    txState.status !== 'failed';

  const isValid =
    name.trim().length > 0 &&
    name.length <= 64 &&
    description.length <= 256 &&
    !isMutating;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;
      await onCreateHabit(name.trim(), description.trim(), frequency);
      // navigate home after a short delay (txState auto-resets in hook)
      setTimeout(() => router.push('/'), 1500);
    },
    [isValid, onCreateHabit, name, description, frequency, router],
  );

  // Preview reward for a 1-day streak
  const previewReward = STREAK_REWARDS[STREAK_REWARDS.length - 1].reward;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Habit name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="habit-name" className="block text-sm font-semibold text-foreground">
              Habit Name <span className="text-destructive">*</span>
            </label>
            <span className={`text-xs tabular-nums ${name.length > 64 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {name.length}/64
            </span>
          </div>
          <input
            id="habit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Run"
            maxLength={80}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition ${
              name.length > 64 ? 'border-destructive ring-destructive/30' : 'border-input'
            }`}
            required
          />
          {name.length > 64 && (
            <p className="mt-1 text-xs text-destructive">Name must be 64 characters or fewer.</p>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="habit-desc" className="block text-sm font-semibold text-foreground">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <span className={`text-xs tabular-nums ${description.length > 256 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {description.length}/256
            </span>
          </div>
          <textarea
            id="habit-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your habit goal..."
            maxLength={280}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none leading-relaxed ${
              description.length > 256 ? 'border-destructive ring-destructive/30' : 'border-input'
            }`}
          />
          {description.length > 256 && (
            <p className="mt-1 text-xs text-destructive">Description must be 256 characters or fewer.</p>
          )}
        </div>

        {/* Frequency */}
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Frequency</p>
          <div className="flex gap-2">
            {(['Daily', 'Weekly'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                  frequency === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Token preview */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <Coins className="h-4 w-4 text-amber-500" />
            Token reward preview
          </div>
          <p className="mt-1 text-amber-700">
            You will earn{' '}
            <span className="font-bold">1 token</span> per check-in to start.
            Reach a{' '}
            <span className="font-bold">7-day streak</span> to earn{' '}
            <span className="font-bold">10 tokens</span> per check-in.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMutating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {txState.action ?? 'Processing...'}
            </>
          ) : (
            'Create Habit'
          )}
        </button>
      </form>

      <TxToast txState={txState} onDismiss={onDismiss} />
    </>
  );
}
