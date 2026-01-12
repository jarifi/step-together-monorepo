// file: services/dashboardService.js

import { apiGet, apiPost, apiPut } from "./api";
import {
  fromIsoLocal,
  inSameDayIso,
  toIsoDate,
  toIsoDateTimeMidnight,
} from "./dto/dashboardDto";

// ---------------------------------------------------------------------------
// SAFE HELPERS
// ---------------------------------------------------------------------------

const toNonNegativeInt = (value) => {
  const s = String(value ?? "").trim();
  const digitsOnly = s.replace(/[^\d]/g, "");
  const n = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

const toDateOnly = (isoLike) => {
  const d = fromIsoLocal(isoLike);
  return d ? toIsoDate(d) : null;
};

const getStepLogId = (obj) =>
  obj?.id ?? obj?.step_log_id ?? obj?.stepLogId ?? obj?.stepLogID ?? null;

const toIsoUtcMidnight = (isoLike) => {
  const d = fromIsoLocal(isoLike);
  if (!d) return null;
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  return new Date(Date.UTC(y, m, day, 0, 0, 0, 0)).toISOString();
};

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
    const dateOnly = toDateOnly(x.date);

    return {
      date: dateOnly ?? (d ? toIsoDate(d) : null),
      dayOfWeek:
        x.dayOfWeek || (d ? d.toLocaleDateString("en-US", { weekday: "long" }) : ""),
      numberOfSteps: Number(x.numberOfSteps ?? 0),
      step_log_id: getStepLogId(x),
    };
  });
};

// ---------------------------------------------------------------------------
// UPSERT STEP LOG (ABSOLUTE TOTAL!) + avoid iOS issues with 307/308 redirects
// ---------------------------------------------------------------------------

const isRedirectStatus = (status) => status === 307 || status === 308;

const putNoRedirect = async (pathNoSlash, body) => {
  try {
    // try without trailing slash
    return await apiPut(pathNoSlash, body);
  } catch (e) {
    if (isRedirectStatus(e?.status)) {
      // retry with trailing slash
      return await apiPut(`${pathNoSlash}/`, body);
    }
    throw e;
  }
};

const postNoRedirect = async (pathNoSlash, body) => {
  try {
    return await apiPost(pathNoSlash, body);
  } catch (e) {
    if (isRedirectStatus(e?.status)) {
      return await apiPost(`${pathNoSlash}/`, body);
    }
    throw e;
  }
};

export const upsertStepsForDate = async (userId, dateISO, absoluteSteps, context) => {
  if (!userId) throw new Error("userId required");
  if (!dateISO) throw new Error("dateISO required");

  const numberOfSteps = toNonNegativeInt(absoluteSteps);

  // Check for existing StepLog for that day
  const all = await listUserStepLogs(userId);
  const existing = (all ?? []).find((log) => inSameDayIso(log.date, dateISO));
  const existingId = getStepLogId(existing);

  // --- UPDATE ---
  if (existingId) {
    return await putNoRedirect(`/step_logs/${existingId}`, { numberOfSteps });
  }

  // --- CREATE ---
  const dateUtcMidnight = toIsoUtcMidnight(dateISO) ?? toIsoDateTimeMidnight(dateISO);

  return await postNoRedirect(`/step_logs/`, {
    challengeId: context?.challengeId,
    teamId: context?.teamId,
    date: dateUtcMidnight,
    numberOfSteps,
  });
};
