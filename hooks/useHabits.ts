'use client';

/**
 * useHabits — central hook for habit CRUD and check-in lifecycle.
 *
 * Manages:
 *   habits[]          — active habit list
 *   stats             — aggregated UserStats
 *   loading           — true during initial fetch only
 *   txState           — tracks active mutation through all 6 TxStatus stages
 *   checkedInMap      — Record<habitId, boolean> fetched on load & after mutations
 *   activeHabitId     — which habit currently has a tx in-flight
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  contractCreateHabit,
  contractCheckIn,
  contractDeactivateHabit,
  contractGetActiveHabits,
  contractGetUserStats,
  contractIsCheckedInToday,
} from '@/lib/contract';
import type { Habit, UserStats, Frequency, TxState, TxStatus } from '@/types';
import { INITIAL_TX_STATE } from '@/types';

export function useHabits(publicKey: string | null) {
  const [habits, setHabits]               = useState<Habit[]>([]);
  const [stats, setStats]                 = useState<UserStats | null>(null);
  const [loading, setLoading]             = useState(false);
  const [txState, setTxState]             = useState<TxState>(INITIAL_TX_STATE);
  const [checkedInMap, setCheckedInMap]   = useState<Record<number, boolean>>({});
  const [activeHabitId, setActiveHabitId] = useState<number | null>(null);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const onStatus = useCallback((status: TxStatus) => {
    setTxState((prev) => ({ ...prev, status }));
  }, []);

  const resetTx = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setTxState(INITIAL_TX_STATE);
    setActiveHabitId(null);
  }, []);

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(resetTx, 5000);
  }, [resetTx]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    try {
      const [fetchedHabits, fetchedStats] = await Promise.all([
        contractGetActiveHabits(publicKey),
        contractGetUserStats(publicKey),
      ]);
      setHabits(fetchedHabits);
      setStats(fetchedStats);

      // Batch-fetch check-in status for all active habits
      const map: Record<number, boolean> = {};
      await Promise.all(
        fetchedHabits.map(async (h) => {
          map[h.id] = await contractIsCheckedInToday(publicKey, h.id);
        }),
      );
      setCheckedInMap(map);

      // Notify NavActions (and any other listeners) that data has changed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('habits:updated'));
      }
    } catch (err) {
      console.error('[useHabits] refresh error:', err);
    }
  }, [publicKey]);

  // Initial fetch whenever publicKey changes
  useEffect(() => {
    if (!publicKey) {
      setHabits([]);
      setStats(null);
      setCheckedInMap({});
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [publicKey, refresh]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createHabit = useCallback(
    async (name: string, description: string, frequency: Frequency) => {
      if (!publicKey) return;
      setTxState({ ...INITIAL_TX_STATE, action: 'Creating habit', status: 'building' });
      try {
        await contractCreateHabit(publicKey, name, description, frequency, onStatus);
        await refresh();
        scheduleReset();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setTxState((prev) => ({ ...prev, status: 'failed', error: msg }));
        setActiveHabitId(null);
      }
    },
    [publicKey, onStatus, refresh, scheduleReset],
  );

  const checkIn = useCallback(
    async (habitId: number) => {
      if (!publicKey) return;
      setActiveHabitId(habitId);
      setTxState({ ...INITIAL_TX_STATE, action: 'Checking in', status: 'building' });
      try {
        const { txHash, reward } = await contractCheckIn(publicKey, habitId, onStatus);
        setTxState((prev) => ({ ...prev, txHash, reward }));
        await refresh();
        scheduleReset();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setTxState((prev) => ({ ...prev, status: 'failed', error: msg }));
        setActiveHabitId(null);
      }
    },
    [publicKey, onStatus, refresh, scheduleReset],
  );

  const deactivateHabit = useCallback(
    async (habitId: number) => {
      if (!publicKey) return;
      setActiveHabitId(habitId);
      setTxState({ ...INITIAL_TX_STATE, action: 'Deactivating habit', status: 'building' });
      try {
        await contractDeactivateHabit(publicKey, habitId, onStatus);
        await refresh();
        scheduleReset();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setTxState((prev) => ({ ...prev, status: 'failed', error: msg }));
        setActiveHabitId(null);
      }
    },
    [publicKey, onStatus, refresh, scheduleReset],
  );

  return {
    habits,
    stats,
    loading,
    txState,
    checkedInMap,
    activeHabitId,
    createHabit,
    checkIn,
    deactivateHabit,
    refresh,
    resetTx,
  };
}
