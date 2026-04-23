// file: services/dashboardService.js

import { apiGet, apiPost, apiPut } from "./api";
import {
  fromIsoLocal,
  inSameDayIso,
  toIsoDate,
  toIsoDateTimeMidnight,
} from "./dto/dashboardDto";

const isUnauthorizedError = (err) => Number(err?.status) === 401;
const isAbortError = (err) => err?.name === "AbortError";

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

const getChallengeIdFromLog = (obj) =>
  obj?.challengeId ?? obj?.challenge_id ?? obj?.challenge?.id ?? null;

const getTeamIdFromLog = (obj) =>
  obj?.teamId ?? obj?.team_id ?? obj?.team?.id ?? null;

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

export const getHomeInit = async (signal) => {
  try {
    return await apiGet("/users/user/dashboard/init", { signal });
  } catch (err) {
    if (isAbortError(err)) {
      throw err;
    }
    if (!isUnauthorizedError(err)) {
      console.error("Error fetching home init:", err);
    }
    return null;
  }
};

// ---------------------------------------------------------------------------
// STEP LOG HELPERS
// ---------------------------------------------------------------------------

export const listMyStepLogs = async () => {
  return await apiGet(`/step_logs/user`);
};

export const getMyWeekStepLogs = async (challengeId, fromISO, toISO, signal) => {
  if (!challengeId) throw new Error("challengeId required");
  if (!fromISO || !toISO) throw new Error("from/to ISO required");

  const path = `/step_logs/challenge/${challengeId}/user?from=${fromISO}&to=${toISO}`;
  return await apiGet(path, { signal });
};

// ---------------------------------------------------------------------------
// WEEK STEPS (mapping + DTO normalization)
// ---------------------------------------------------------------------------

export const getWeekSteps = async (challengeId, weekStartISO, signal) => {
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
      toIsoDate(weekEnd),
      signal
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
    if (isAbortError(err)) {
      throw err;
    }
    if (!isUnauthorizedError(err)) {
      console.error("Error fetching week steps:", err);
    }
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
  const ctxChallengeId = context?.challengeId != null ? Number(context.challengeId) : null;
  const ctxTeamId = context?.teamId != null ? Number(context.teamId) : null;

  const all = await listMyStepLogs();
  const existing = (all ?? []).find((log) => {
    if (!inSameDayIso(log.date, dateISO)) return false;

    const logChallengeIdRaw = getChallengeIdFromLog(log);
    const logChallengeId = logChallengeIdRaw != null ? Number(logChallengeIdRaw) : null;
    if (ctxChallengeId != null && logChallengeId !== ctxChallengeId) return false;

    const logTeamIdRaw = getTeamIdFromLog(log);
    const logTeamId = logTeamIdRaw != null ? Number(logTeamIdRaw) : null;
    if (ctxTeamId != null && logTeamId !== ctxTeamId) return false;
    if (ctxTeamId == null && logTeamId != null) return false;

    return true;
  });
  const existingId = getStepLogId(existing);
  const existingTeamIdRaw = getTeamIdFromLog(existing);
  const existingTeamId = existingTeamIdRaw != null ? Number(existingTeamIdRaw) : null;

  const buildPayload = ({ includeDate = false }) => {
    const payload = {
      numberOfSteps,
    };

    if (ctxChallengeId != null) {
      payload.challengeId = ctxChallengeId;
    }

    // For team challenges, prefer explicit context teamId and fallback to existing log teamId on update.
    const resolvedTeamId = ctxTeamId ?? existingTeamId;
    if (resolvedTeamId != null) {
      payload.teamId = resolvedTeamId;
    }

    if (includeDate) {
      payload.date = toIsoUtcMidnight(dateISO) ?? toIsoDateTimeMidnight(dateISO);
    }

    return payload;
  };

  if (existingId) {
    const payload = buildPayload({ includeDate: false });

    console.log("upsertStepsForDate: PUT", {
      stepLogId: existingId,
      challengeId: payload.challengeId ?? null,
      teamId: payload.teamId ?? null,
      dateISO,
      numberOfSteps,
    });
    return await putNoRedirect(`/step_logs/${existingId}`, payload);
  }

  const payload = buildPayload({ includeDate: true });

  console.log("upsertStepsForDate: POST", {
    challengeId: payload.challengeId ?? null,
    teamId: payload.teamId ?? null,
    date: payload.date,
    numberOfSteps,
  });

  return await postNoRedirect(`/step_logs/`, payload);
};