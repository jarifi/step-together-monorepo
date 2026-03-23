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

export const listMyStepLogs = async () => {
  return await apiGet(`/step_logs/user`);
};

export const getMyWeekStepLogs = async (challengeId, fromISO, toISO) => {
  if (!challengeId) throw new Error("challengeId required");
  if (!fromISO || !toISO) throw new Error("from/to ISO required");

  const path = `/step_logs/challenge/${challengeId}/user?from=${fromISO}&to=${toISO}`;
  return await apiGet(path);
};

// ---------------------------------------------------------------------------
// WEEK STEPS (mapping + DTO normalization)
// ---------------------------------------------------------------------------

export const getWeekSteps = async (challengeId, weekStartISO) => {
  if (!challengeId) throw new Error("challengeId required");
  if (!weekStartISO) throw new Error("weekStartISO required");

  const weekStart = fromIsoLocal(weekStartISO);
  if (!weekStart) return [];

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  try {
    const logs = await getMyWeekStepLogs(
      challengeId,
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
  } catch (err) {
    console.error("Error fetching week steps:", err);
    return [];
  }
};

// ---------------------------------------------------------------------------
// UPSERT STEP LOG
// ---------------------------------------------------------------------------

const isRedirectStatus = (status) => status === 307 || status === 308;

const putNoRedirect = async (pathNoSlash, body) => {
  try {
    return await apiPut(pathNoSlash, body);
  } catch (e) {
    if (isRedirectStatus(e?.status)) {
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

export const upsertStepsForDate = async (dateISO, absoluteSteps, context) => {
  if (!dateISO) throw new Error("dateISO required");

  const numberOfSteps = toNonNegativeInt(absoluteSteps);

  const all = await listMyStepLogs();
  const existing = (all ?? []).find((log) => inSameDayIso(log.date, dateISO));
  const existingId = getStepLogId(existing);

  if (existingId) {
    return await putNoRedirect(`/step_logs/${existingId}`, { numberOfSteps });
  }

  const dateUtcMidnight = toIsoUtcMidnight(dateISO) ?? toIsoDateTimeMidnight(dateISO);

  return await postNoRedirect(`/step_logs/`, {
    challengeId: context?.challengeId,
    teamId: context?.teamId,
    date: dateUtcMidnight,
    numberOfSteps,
  });
};