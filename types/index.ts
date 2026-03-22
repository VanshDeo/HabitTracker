// ── Habit types ───────────────────────────────────────────────────────────────

export type Frequency = 'Daily' | 'Weekly';

export interface Habit {
  id: number;
  owner: string;
  name: string;
  description: string;
  frequency: Frequency;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDay: number; // Ledger day number; 0 = never completed
  createdAt: number;        // Unix timestamp (seconds)
  isActive: boolean;
}

export interface UserStats {
  totalHabits: number;
  tokenBalance: number; // Token balance as number (from i128)
  totalCheckIns: number;
}

// ── Transaction status machine ────────────────────────────────────────────────

export type TxStatus =
  | 'idle'
  | 'building'
  | 'awaiting_signature'
  | 'submitting'
  | 'polling'
  | 'success'
  | 'failed';

export interface TxState {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  action: string | null;  // e.g. "Creating habit", "Checking in"
  reward: number | null;  // Token reward from most recent check-in
}

export const INITIAL_TX_STATE: TxState = {
  status: 'idle',
  txHash: null,
  error: null,
  action: null,
  reward: null,
};

// ── Token reward thresholds ───────────────────────────────────────────────────

export const STREAK_REWARDS: { threshold: number; reward: number; label: string }[] = [
  { threshold: 100, reward: 50, label: 'Legend'    },
  { threshold: 30,  reward: 20, label: 'Champion'  },
  { threshold: 7,   reward: 10, label: 'Committed' },
  { threshold: 3,   reward: 5,  label: 'Building'  },
  { threshold: 0,   reward: 1,  label: 'Starting'  },
];

export function getStreakReward(streak: number): typeof STREAK_REWARDS[0] {
  return (
    STREAK_REWARDS.find((r) => streak >= r.threshold) ??
    STREAK_REWARDS[STREAK_REWARDS.length - 1]
  );
}
