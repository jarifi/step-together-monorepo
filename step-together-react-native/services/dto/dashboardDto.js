// ======================
// Helpers
// ======================

export const MS_PER_DAY = 86400000;

export const stripTime = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const toIsoDate = (d) => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// ISO “YYYY-MM-DD[...optional time...]” → Date (lokal, ohne UTC-Shift)
export const fromIsoLocal = (s) => {
  if (!s) return null;
  const base = String(s).split('T')[0];
  const [y, m, d] = base.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

// "YYYY-MM-DD" | "YYYY-MM-DDTHH:mm:ss" -> "YYYY-MM-DDT00:00:00"
export const toIsoDateTimeMidnight = (iso) => {
  const base = String(iso).split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) {
    throw new Error(`Invalid iso date: ${iso}`);
  }
  return `${base}T00:00:00`;
};

export const inSameDayIso = (lhsIso, rhsIso) => {
  const l = fromIsoLocal(lhsIso);
  const r = fromIsoLocal(rhsIso);
  if (!l || !r) return false;
  return toIsoDate(l) === toIsoDate(r);
};

export const sameDay = (a, b) =>
  !!a &&
  !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const startOfWeek = (d) => {
  const copy = stripTime(d);
  const dow = (copy.getDay() + 6) % 7; // Mo=0..So=6
  copy.setDate(copy.getDate() - dow);
  return copy;
};

export const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const lastOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const daysBetween = (a, b) =>
  Math.ceil((stripTime(b).getTime() - stripTime(a).getTime()) / MS_PER_DAY);

export const isInRange = (d, min, max) => {
  const x = stripTime(d);
  const lo = min ? stripTime(min) : null;
  const hi = max ? stripTime(max) : null;
  if (lo && x < lo) return false;
  if (hi && x > hi) return false;
  return true;
};

export const clampDate = (d, min, max) => {
  const x = stripTime(d);
  if (min && x < stripTime(min)) return stripTime(min);
  if (max && x > stripTime(max)) return stripTime(max);
  return x;
};

// ======================
// Steps-Helpers
// ======================

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const dayLabelDe = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
export const dayLabelEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeDayOfWeek = (val) => {
  if (!val) return null;
  const s = String(val).toLowerCase();

  let idx = dayLabelEn.findIndex((d) => d.toLowerCase() === s);
  if (idx >= 0) return dayLabelDe[idx];

  idx = dayLabelDe.findIndex((d) => d.toLowerCase() === s);
  return idx >= 0 ? dayLabelDe[idx] : null;
};

// Woche Mo..So exakt zur Pivot-Woche
export const parseStepsThisWeek = (raw, pivotMonday) => {
  const baseMonday = startOfWeek(pivotMonday || new Date());
  const sums = new Array(7).fill(0);

  const addAtIdx = (idx, v) => {
    if (idx >= 0 && idx < 7) {
      const n = Math.floor(Number(v) || 0);
      sums[idx] = n;
    }
  };

  if (Array.isArray(raw) && raw.length) {
    if (typeof raw[0] === 'number') {
      raw.slice(0, 7).forEach((n, i) => addAtIdx(i, n));
    } else {
      for (const e of raw) {
        const val = e?.numberOfSteps ?? e?.steps ?? 0;
        let idx = -1;

        if (e?.date) {
          const d = fromIsoLocal(e.date);
          if (d && startOfWeek(d).getTime() === baseMonday.getTime()) {
            idx = (d.getDay() + 6) % 7;
          }
        }

        if (idx < 0 && e?.dayOfWeek) {
          const de = normalizeDayOfWeek(e.dayOfWeek);
          if (de) idx = dayLabelDe.indexOf(de);
        }

        addAtIdx(idx, val);
      }
    }
  }

  return sums.map((n, i) => {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + i);
    return {
      date: toIsoDate(d),
      dayOfWeek: dayLabelDe[i],
      numberOfSteps: n,
    };
  });
};

// ======================
// Main Mapper
// ======================

export const toDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const mapHomeInitToDashboard = (data, pivotMonday) => {
  if (!data) return null;

  const user = data?.user ?? null;
  const team = data?.team ?? null;
  const rawChallenge = data?.challenge ?? null;

  const upcoming =
    data?.upcomingChallenge ||
    data?.nextChallenge ||
    data?.upcoming_challenge ||
    null;

  let challenge =
    rawChallenge && rawChallenge?.state === 'open'
      ? rawChallenge
      : null;

  if (!challenge && upcoming && upcoming?.state === 'upcoming') {
    challenge = upcoming;
  }

  if (!challenge && rawChallenge && (rawChallenge?.id != null || rawChallenge?.name)) {
    challenge = rawChallenge;
  }

  const start = toDate(challenge?.startDate ?? challenge?.start_date);
  const end = toDate(challenge?.endDate ?? challenge?.end_date);
  const now = new Date();

  let daysLeft = 0;
  let timeProgress = 0;

  if (start && end && end > start) {
    const span = end.getTime() - start.getTime();
    timeProgress = clamp01((now.getTime() - start.getTime()) / span);
    daysLeft = Math.max(0, daysBetween(now, end));
  }

  const distAny = challenge?.distanceKm ?? challenge?.distance ?? challenge?.distance_km;
  const distanceKm = Number.isFinite(Number(distAny)) ? Number(distAny) : 0;

  return {
    user: {
      id: Number.isFinite(Number(user?.id)) ? Number(user?.id) : null,
      name: user?.name || '',
      email: user?.email || '',
      stepLength: Number.isFinite(Number(user?.stepLength ?? user?.step_length))
        ? Number(user?.stepLength ?? user?.step_length)
        : 0,
    },
    team: {
      id: Number.isFinite(Number(team?.id)) ? Number(team?.id) : null,
      name: team?.name || '',
    },
    challenge: challenge
      ? {
          id: Number.isFinite(Number(challenge?.id)) ? Number(challenge?.id) : null,
          name: challenge?.name || '',
          startLocation: challenge?.startLocation ?? challenge?.start_location ?? '',
          targetLocation: challenge?.targetLocation ?? challenge?.target_location ?? '',
          distanceKm,
          startDate: start,
          endDate: end,
          state: challenge?.state || '',
          daysLeft,
          timeProgress,
        }
      : {
          id: null,
          name: '',
          startLocation: '',
          targetLocation: '',
          distanceKm: 0,
          startDate: null,
          endDate: null,
          state: '',
          daysLeft: 0,
          timeProgress: 0,
        },
    steps_this_week: parseStepsThisWeek(data?.steps_this_week, pivotMonday),
  };
};