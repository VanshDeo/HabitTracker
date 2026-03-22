'use client';

import { getStreakReward } from '@/types';

interface StreakBadgeProps {
  streak: number;
}

function streakClasses(streak: number): { bg: string; text: string; ring: string } {
  if (streak >= 100) return { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200' };
  if (streak >= 30)  return { bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-200'  };
  if (streak >= 7)   return { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' };
  if (streak >= 3)   return { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-200'   };
  return               { bg: 'bg-slate-100',  text: 'text-slate-600',  ring: 'ring-slate-200'  };
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const { label } = getStreakReward(streak);
  const cls       = streakClasses(streak);

  return (
    <div className={`inline-flex flex-col items-center rounded-xl px-3 py-2 ring-1 ${cls.bg} ${cls.ring}`}>
      <span className={`text-2xl font-extrabold leading-none tabular-nums ${cls.text}`}>
        {streak}
      </span>
      <span className={`mt-0.5 text-xs font-semibold leading-none ${cls.text}`}>
        {streak === 1 ? 'day' : 'days'} &middot; {label}
      </span>
    </div>
  );
}
