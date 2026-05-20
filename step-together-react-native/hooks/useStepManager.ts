import { useCallback, useRef, useState } from 'react';
import { getWeekSteps, upsertStepsForDate } from '../services/dashboardService';
import { clampDate, parseStepsThisWeek, startOfWeek } from '../services/dto/dashboardDto';

export type StepsEntry = {
  date: string;
  dayOfWeek: string;
  numberOfSteps: number;
};

export const EMPTY_WEEK = [0, 0, 0, 0, 0, 0, 0] as const;
export const MAX_STEP_DELTA = 100000;

export interface UseStepManagerProps {
  userId: number;
  challengeId: number;
  teamId: number;
  displayDate: Date;
  minDate?: Date | null;
  maxDate?: Date | null;
}

export const useStepManager = ({
  userId,
  challengeId,
  teamId,
  displayDate,
  minDate,
  maxDate,
}: UseStepManagerProps) => {
  const [weekSteps, setWeekSteps] = useState<number[]>([...EMPTY_WEEK]);
  const [stepsToday, setStepsToday] = useState(0);
  const [weekLoading, setWeekLoading] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);

  const isMountedRef = useRef(true);

  // --- Safe clamp ---
  const safeDate = clampDate(displayDate, minDate ?? null, maxDate ?? null);

  // --- Fetch week ---
  const refreshWeek = useCallback(async () => {
    if (!userId || !challengeId) return;

    const weekStart = startOfWeek(safeDate);
    setWeekLoading(true);

    try {
      const resp = await getWeekSteps(challengeId, userId, weekStart.toISOString());
      const parsed = parseStepsThisWeek(resp ?? [], weekStart);
      const arr = parsed.map((x) => x.numberOfSteps);

      if (!isMountedRef.current) return;

      setWeekSteps(arr);
      setStepsToday(arr[(safeDate.getDay() + 6) % 7] ?? 0);
    } finally {
      if (isMountedRef.current) setWeekLoading(false);
    }
  }, [userId, challengeId, safeDate]);

  // --- Save absolute steps ---
  const saveAbsoluteStepsForSelectedDay = useCallback(
    async (value: number) => {
      if (!userId || !challengeId || !teamId) return;

      await upsertStepsForDate(userId, safeDate.toISOString(), value, {
        challengeId,
        teamId,
      });

      await refreshWeek();
    },
    [userId, challengeId, teamId, safeDate, refreshWeek]
  );

  // --- Apply delta safely ---
  const applyStepDelta = useCallback(
    async (delta: number) => {
      if (savingSteps) return;
      setSavingSteps(true);

      try {
        const idx = (safeDate.getDay() + 6) % 7;
        const current = weekSteps[idx] ?? 0;
        const next = Math.max(0, current + delta);
        await saveAbsoluteStepsForSelectedDay(next);
      } finally {
        setSavingSteps(false);
      }
    },
    [savingSteps, safeDate, weekSteps, saveAbsoluteStepsForSelectedDay]
  );

  return {
    weekSteps,
    stepsToday,
    weekLoading,
    savingSteps,
    refreshWeek,
    applyStepDelta,
  };
};
