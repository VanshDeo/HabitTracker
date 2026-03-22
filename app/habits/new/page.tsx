'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useHabits } from '@/hooks/useHabits';
import { CreateHabitForm } from '@/components/CreateHabitForm';
import { ConnectWallet } from '@/components/ConnectWallet';
import { ArrowLeft, Coins } from 'lucide-react';

const REWARD_TABLE = [
  { range: '1 – 2',   tokens: 1,  label: 'Starting'  },
  { range: '3 – 6',   tokens: 5,  label: 'Building'  },
  { range: '7 – 29',  tokens: 10, label: 'Committed' },
  { range: '30 – 99', tokens: 20, label: 'Champion'  },
  { range: '100+',    tokens: 50, label: 'Legend'     },
];

export default function NewHabitPage() {
  const router = useRouter();
  const { publicKey, isConnected } = useWallet();
  const { txState, createHabit, resetTx } = useHabits(publicKey);

  async function handleCreate(name: string, description: string, frequency: 'Daily' | 'Weekly') {
    await createHabit(name, description, frequency);
    // Navigate back to dashboard after the tx state enters success
    setTimeout(() => router.push('/'), 1800);
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground text-balance">
          Create a New Habit
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Build consistency and earn HABIT tokens for every streak milestone —
          recorded permanently on Stellar Soroban.
        </p>
      </div>

      {/* Token reward tier table */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Token Reward Tiers</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left font-semibold text-muted-foreground">Streak</th>
              <th className="pb-2 text-center font-semibold text-muted-foreground">
                Tokens / check-in
              </th>
              <th className="pb-2 text-right font-semibold text-muted-foreground">Tier</th>
            </tr>
          </thead>
          <tbody>
            {REWARD_TABLE.map(({ range, tokens, label }) => (
              <tr key={range} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 font-mono text-foreground">{range}</td>
                <td className="py-2.5 text-center font-bold text-amber-600">
                  {tokens} {tokens === 1 ? 'token' : 'tokens'}
                </td>
                <td className="py-2.5 text-right text-muted-foreground">{label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form or connect prompt */}
      {isConnected ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <CreateHabitForm
            onCreateHabit={handleCreate}
            txState={txState}
            onDismiss={resetTx}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <p className="mb-4 text-sm text-muted-foreground">
            Connect your Freighter wallet to create a habit.
          </p>
          <ConnectWallet />
        </div>
      )}
    </div>
  );
}
