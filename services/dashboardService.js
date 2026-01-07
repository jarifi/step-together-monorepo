// file: services/dashboardService.js

import { apiGet, apiPost, apiPut } from "./api";
import {
  fromIsoLocal,
  inSameDayIso,
  toIsoDate,
  toIsoDateTimeMidnight,
} from "./dto/dashboardDto";

// ---------------------------------------------------------------------------
// DASHBOARD INIT
// ---------------------------------------------------------------------------

export const getHomeInit = async () => {
  try {
    return await apiGet("/users/user/dashboard/init");
  } catch (err) {
    console.error("Error fetching home init:", err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// STEP LOG HELPERS
// ---------------------------------------------------------------------------

export const listUserStepLogs = async (userId) => {
  if (!userId) throw new Error("userId required");
  return await apiGet(`/step_logs/user/${userId}`);
};

export const getUserWeekStepLogs = async (challengeId, userId, fromISO, toISO) => {
  if (!challengeId) throw new Error("challengeId required");
  if (!userId) throw new Error("userId required");
  if (!fromISO || !toISO) throw new Error("from/to ISO required");

  const path = `/step_logs/challenge/${challengeId}/user/${userId}?from=${fromISO}&to=${toISO}`;
  return await apiGet(path);
};

// ---------------------------------------------------------------------------
// WEEK STEPS (mapping + DTO normalization)
// ---------------------------------------------------------------------------

export const getWeekSteps = async (challengeId, userId, weekStartISO) => {
  if (!challengeId) throw new Error("challengeId required");
  if (!userId) throw new Error("userId required");
  if (!weekStartISO) throw new Error("weekStartISO required");

  const weekStart = fromIsoLocal(weekStartISO);
  if (!weekStart) return [];

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const logs = await getUserWeekStepLogs(
    challengeId,
    userId,
    toIsoDate(weekStart),
    toIsoDate(weekEnd)
  );

  return (logs ?? []).map((x) => {
    const d = fromIsoLocal(x.date);
    return {
      date: toIsoDate(d),
      dayOfWeek: x.dayOfWeek || d.toLocaleDateString("en-US", { weekday: "long" }),
      numberOfSteps: Number(x.numberOfSteps || 0),
      step_log_id: x?.id ?? null,
    };
  });
};

// ---------------------------------------------------------------------------
// UPSERT STEP LOG
// ---------------------------------------------------------------------------

export const upsertStepsForDate = async (
  userId,
  dateISO,
  absoluteSteps,
  context // { challengeId, teamId }
) => {
  if (!userId) throw new Error("userId required");
  if (!dateISO) throw new Error("dateISO required");

  const numberOfSteps = Math.max(0, Number(absoluteSteps || 0));
  console.log(`Upsert steps for user ${userId} on ${dateISO}: ${numberOfSteps} steps`);

  // Check for existing StepLog
  const all = await listUserStepLogs(userId);
  const existing = (all ?? []).find((log) => inSameDayIso(log.date, dateISO));

  // --- UPDATE ---------------------------------------------------------------
  if (existing?.id) {
    return await apiPut(`/step_logs?step_log_id=${existing.id}`, {
      numberOfSteps,
    });
  }

  // --- CREATE ---------------------------------------------------------------
  if (!context?.challengeId || !context?.teamId) {
    throw new Error("challengeId/teamId required for create");
  }

  return await apiPost(`/step_logs`, {
    challengeId: context.challengeId,
    teamId: context.teamId,
    date: toIsoDateTimeMidnight(dateISO),
    numberOfSteps,
  });
};
