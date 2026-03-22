'use client';

/**
 * contract.ts — All Soroban contract interactions.
 *
 * Full implementation follows the Stellar JS SDK transaction lifecycle:
 *   build → simulate → assemble → sign (Freighter) → send → poll
 *
 * In the demo environment (no CONTRACT_ID set) a local in-memory store
 * mirrors the exact on-chain data model so the UI works end-to-end.
 */

import type { Habit, UserStats, Frequency, TxStatus } from '@/types';
import { signTransaction } from './wallet';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? '';
const RPC_URL     = process.env.NEXT_PUBLIC_RPC_URL     ?? 'https://soroban-testnet.stellar.org';
const NET_PASS    = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';
const SECONDS_PER_DAY = 86_400;

// ── Demo in-memory store (active when CONTRACT_ID is absent) ──────────────────

interface DemoStore {
  habits:      Map<string, Habit[]>;
  stats:       Map<string, UserStats>;
  idCounters:  Map<string, number>;
}

const demo: DemoStore = {
  habits:     new Map(),
  stats:      new Map(),
  idCounters: new Map(),
};

function currentDay(): number {
  return Math.floor(Date.now() / 1000 / SECONDS_PER_DAY);
}

function tokenReward(streak: number): number {
  if (streak >= 100) return 50;
  if (streak >= 30)  return 20;
  if (streak >= 7)   return 10;
  if (streak >= 3)   return 5;
  return 1;
}

function demoGetHabits(owner: string): Habit[] {
  return demo.habits.get(owner) ?? [];
}

function demoGetStats(owner: string): UserStats {
  return demo.stats.get(owner) ?? { totalHabits: 0, tokenBalance: 0, totalCheckIns: 0 };
}

function demoSetHabits(owner: string, habits: Habit[]) {
  demo.habits.set(owner, habits);
}

function demoSetStats(owner: string, stats: UserStats) {
  demo.stats.set(owner, stats);
}

async function simulateDelay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Simulate the full 5-stage transaction lifecycle with realistic timing. */
async function demoRunTx(
  onStatus: (s: TxStatus) => void,
  work: () => void,
): Promise<string> {
  onStatus('building');
  await simulateDelay(600);
  onStatus('awaiting_signature');
  await simulateDelay(800);
  onStatus('submitting');
  await simulateDelay(600);
  onStatus('polling');
  work(); // apply mutation
  await simulateDelay(1200);
  onStatus('success');
  const fakeTxHash = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return fakeTxHash;
}

// ── Shared write tx lifecycle (real Stellar path) ─────────────────────────────

async function runTx(
  source: string,
  operationArgs: { fn: string; args: unknown[] },
  onStatus: (s: TxStatus) => void,
): Promise<string> {
  // Dynamically import Stellar SDK — only resolves when the env has it
  let sdk: typeof import('@stellar/stellar-sdk') | null = null;
  try {
    sdk = await import('@stellar/stellar-sdk');
  } catch {
    sdk = null;
  }

  if (!sdk || !CONTRACT_ID) {
    throw new Error('Stellar SDK or CONTRACT_ID not available');
  }

  const { Contract, SorobanRpc, TransactionBuilder, BASE_FEE, nativeToScVal, Address, xdr } = sdk;

  onStatus('building');
  const server   = new SorobanRpc.Server(RPC_URL, { allowHttp: false });
  const contract = new Contract(CONTRACT_ID);
  const account  = await server.getAccount(source);

  const op = contract.call(operationArgs.fn, ...(operationArgs.args as Parameters<typeof contract.call>[1][]));
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NET_PASS })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) throw new Error(`Simulation error: ${sim.error}`);

  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  onStatus('awaiting_signature');
  const signed = await signTransaction(prepared.toXDR(), { networkPassphrase: NET_PASS });

  onStatus('submitting');
  const result = await server.sendTransaction(TransactionBuilder.fromXDR(signed, NET_PASS));
  if (result.status === 'ERROR') throw new Error(result.errorResult?.toString() ?? 'Submission failed');

  onStatus('polling');
  const hash = result.hash;
  for (let i = 0; i < 20; i++) {
    await simulateDelay(1500);
    const poll = await server.getTransaction(hash);
    if (poll.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      onStatus('success');
      return hash;
    }
    if (poll.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Transaction failed on-chain');
    }
  }
  throw new Error('Transaction timed out after 30s');
}

// ── Read-only simulation (no signing, no fees) ────────────────────────────────

async function readTx<T>(owner: string, fn: string, extraArgs: unknown[] = []): Promise<T> {
  let sdk: typeof import('@stellar/stellar-sdk') | null = null;
  try {
    sdk = await import('@stellar/stellar-sdk');
  } catch {
    sdk = null;
  }

  if (!sdk || !CONTRACT_ID) {
    throw new Error('SDK unavailable');
  }

  const { Contract, SorobanRpc, TransactionBuilder, BASE_FEE, Address, scValToNative } = sdk;
  const server   = new SorobanRpc.Server(RPC_URL, { allowHttp: false });
  const contract = new Contract(CONTRACT_ID);

  const fakeAccount = {
    accountId:               () => CONTRACT_ID,
    sequenceNumber:          () => '0',
    incrementSequenceNumber: () => {},
  } as unknown as Parameters<typeof TransactionBuilder>[0];

  const op = contract.call(fn, new Address(owner).toScVal(), ...extraArgs as Parameters<typeof contract.call>[1][]);
  const tx = new TransactionBuilder(fakeAccount, { fee: BASE_FEE, networkPassphrase: NET_PASS })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) throw new Error(`Read error: ${sim.error}`);
  const success = sim as SorobanRpc.Api.SimulateTransactionSuccessResponse;
  return scValToNative(success.result!.retval) as T;
}

// ── Decode raw XDR object → Habit (snake_case → camelCase) ───────────────────

function decodeHabit(raw: unknown): Habit {
  const o = raw as Record<string, unknown>;
  return {
    id:               Number(o['id']),
    owner:            String(o['owner']),
    name:             String(o['name']),
    description:      String(o['description']),
    frequency:        String(o['frequency']) as Frequency,
    streak:           Number(o['streak']),
    longestStreak:    Number(o['longest_streak']),
    totalCompletions: Number(o['total_completions']),
    lastCompletedDay: Number(o['last_completed_day']),
    createdAt:        Number(o['created_at']),
    isActive:         Boolean(o['is_active']),
  };
}

// ── Exported contract functions ───────────────────────────────────────────────

/**
 * Create a new habit on-chain.
 * Falls back to demo store when CONTRACT_ID is not set.
 */
export async function contractCreateHabit(
  owner: string,
  name: string,
  description: string,
  frequency: Frequency,
  onStatus: (s: TxStatus) => void,
): Promise<{ txHash: string; habitId: number }> {
  if (!CONTRACT_ID) {
    let habitId = 0;
    const hash = await demoRunTx(onStatus, () => {
      const counter = demo.idCounters.get(owner) ?? 0;
      habitId = counter;
      demo.idCounters.set(owner, counter + 1);
      const habits = demoGetHabits(owner);
      habits.push({
        id: habitId,
        owner,
        name,
        description,
        frequency,
        streak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        lastCompletedDay: 0,
        createdAt: Math.floor(Date.now() / 1000),
        isActive: true,
      });
      demoSetHabits(owner, habits);
      const stats = demoGetStats(owner);
      demoSetStats(owner, { ...stats, totalHabits: stats.totalHabits + 1 });
    });
    return { txHash: hash, habitId };
  }

  try {
    const sdk = await import('@stellar/stellar-sdk');
    const freqScVal =
      frequency === 'Daily'
        ? sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol('Daily')])
        : sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol('Weekly')]);

    const args = [
      new sdk.Address(owner).toScVal(),
      sdk.nativeToScVal(name,        { type: 'string' }),
      sdk.nativeToScVal(description, { type: 'string' }),
      freqScVal,
    ];
    const txHash = await runTx(owner, { fn: 'create_habit', args }, onStatus);
    const habits  = await contractGetHabits(owner);
    const habitId = habits.length > 0 ? habits[habits.length - 1].id : 0;
    return { txHash, habitId };
  } catch (err) {
    throw err;
  }
}

/**
 * Mark a habit complete for today and earn token rewards.
 */
export async function contractCheckIn(
  owner: string,
  habitId: number,
  onStatus: (s: TxStatus) => void,
): Promise<{ txHash: string; reward: number }> {
  if (!CONTRACT_ID) {
    let reward = 0;
    const hash = await demoRunTx(onStatus, () => {
      const day    = currentDay();
      const habits = demoGetHabits(owner);
      const idx    = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) throw new Error('Habit not found');
      const habit  = { ...habits[idx] };
      if (!habit.isActive) throw new Error('Habit is inactive');
      if (habit.lastCompletedDay === day) throw new Error('Already checked in today');

      if (habit.lastCompletedDay === day - 1) {
        habit.streak += 1;
      } else {
        habit.streak = 1;
      }
      if (habit.streak > habit.longestStreak) habit.longestStreak = habit.streak;
      habit.lastCompletedDay = day;
      habit.totalCompletions += 1;
      reward = tokenReward(habit.streak);
      habits[idx] = habit;
      demoSetHabits(owner, habits);
      const stats = demoGetStats(owner);
      demoSetStats(owner, {
        ...stats,
        tokenBalance:  stats.tokenBalance + reward,
        totalCheckIns: stats.totalCheckIns + 1,
      });
    });
    return { txHash: hash, reward };
  }

  try {
    const sdk   = await import('@stellar/stellar-sdk');
    const args  = [
      new sdk.Address(owner).toScVal(),
      sdk.nativeToScVal(habitId, { type: 'u32' }),
    ];
    const txHash = await runTx(owner, { fn: 'check_in', args }, onStatus);
    return { txHash, reward: 0 };
  } catch (err) {
    throw err;
  }
}

/**
 * Soft-delete a habit (sets is_active = false).
 */
export async function contractDeactivateHabit(
  owner: string,
  habitId: number,
  onStatus: (s: TxStatus) => void,
): Promise<string> {
  if (!CONTRACT_ID) {
    return demoRunTx(onStatus, () => {
      const habits = demoGetHabits(owner);
      const idx    = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) throw new Error('Habit not found');
      habits[idx] = { ...habits[idx], isActive: false };
      demoSetHabits(owner, habits);
    });
  }

  try {
    const sdk  = await import('@stellar/stellar-sdk');
    const args = [
      new sdk.Address(owner).toScVal(),
      sdk.nativeToScVal(habitId, { type: 'u32' }),
    ];
    return runTx(owner, { fn: 'deactivate_habit', args }, onStatus);
  } catch (err) {
    throw err;
  }
}

/** Returns ALL habits (active + inactive) for a wallet address. */
export async function contractGetHabits(owner: string): Promise<Habit[]> {
  if (!CONTRACT_ID) return demoGetHabits(owner);
  try {
    const raw = await readTx<unknown[]>(owner, 'get_habits');
    return Array.isArray(raw) ? raw.map(decodeHabit) : [];
  } catch {
    return [];
  }
}

/** Returns only active habits for a wallet address. */
export async function contractGetActiveHabits(owner: string): Promise<Habit[]> {
  if (!CONTRACT_ID) return demoGetHabits(owner).filter((h) => h.isActive);
  try {
    const raw = await readTx<unknown[]>(owner, 'get_active_habits');
    return Array.isArray(raw) ? raw.map(decodeHabit) : [];
  } catch {
    return [];
  }
}

/** Returns aggregated UserStats for a wallet address. */
export async function contractGetUserStats(owner: string): Promise<UserStats> {
  if (!CONTRACT_ID) return demoGetStats(owner);
  try {
    const raw = await readTx<Record<string, unknown>>(owner, 'get_user_stats');
    return {
      totalHabits:   Number(raw['total_habits']),
      tokenBalance:  Number(raw['token_balance']),
      totalCheckIns: Number(raw['total_check_ins']),
    };
  } catch {
    return { totalHabits: 0, tokenBalance: 0, totalCheckIns: 0 };
  }
}

/** Returns true if the habit has already been checked in today. */
export async function contractIsCheckedInToday(
  owner: string,
  habitId: number,
): Promise<boolean> {
  if (!CONTRACT_ID) {
    const habits = demoGetHabits(owner);
    const habit  = habits.find((h) => h.id === habitId);
    if (!habit) return false;
    return habit.lastCompletedDay === currentDay();
  }
  try {
    const sdk  = await import('@stellar/stellar-sdk');
    const args = [sdk.nativeToScVal(habitId, { type: 'u32' })];
    return readTx<boolean>(owner, 'is_checked_in_today', args);
  } catch {
    return false;
  }
}
