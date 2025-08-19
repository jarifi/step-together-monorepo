// Helpers
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const toDate = (iso) => (iso ? new Date(iso) : null);

const MS_PER_DAY = 86_400_000;

// "YYYY-MM-DD" als lokales Datum (vermeidet UTC-Shift)
const fromIsoLocal = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).split('-').map((n) => Number(n));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export const mondayOf = (d) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (c.getDay() + 6) % 7; // 0=Mo..6=So
  c.setDate(c.getDate() - dow);
  c.setHours(0, 0, 0, 0);
  return c;
};

const daysBetween = (a, b) => Math.ceil((b.getTime() - a.getTime()) / MS_PER_DAY);

const dayLabelDe = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
const dayLabelEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeDayOfWeek = (val) => {
  if (!val) return null;
  const s = String(val).toLowerCase();
  let idx = dayLabelEn.findIndex((d) => d.toLowerCase() === s);
  if (idx >= 0) return dayLabelDe[idx];
  idx = dayLabelDe.findIndex((d) => d.toLowerCase() === s);
  return idx >= 0 ? dayLabelDe[idx] : null;
};

// ======================
// Woche Mo..So exakt zur Pivot-Woche
// ======================
export const parseStepsThisWeek = (raw, pivotMonday) => {
  const baseMonday = mondayOf(pivotMonday || new Date());
  const sums = new Array(7).fill(0);

  const addAtIdx = (idx, v) => {
    if (idx >= 0 && idx < 7) {
      const n = Math.floor(Number(v) || 0);
      if (n > 0) sums[idx] += n;
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
          if (d) {
            const diffMon = mondayOf(d).getTime() - baseMonday.getTime();
            if (diffMon === 0) idx = (d.getDay() + 6) % 7;
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
    return { date: toIsoDate(d), dayOfWeek: dayLabelDe[i], numberOfSteps: n };
  });
};

// ======================
// Main Mapper
// ======================
export const mapHomeInitToDashboard = (data, pivotMonday) => {
  if (!data) return null;
  const { user = {}, team = {}, challenge = {} } = data;

  const start = toDate(challenge.startDate);
  const end = toDate(challenge.endDate);
  const now = new Date();

  let daysLeft = 0;
  let timeProgress = 0;
  if (start && end && end > start) {
    const span = end.getTime() - start.getTime();
    timeProgress = clamp01((now.getTime() - start.getTime()) / span);
    daysLeft = Math.max(0, daysBetween(now, end));
  }

  const distAny = challenge.distanceKm ?? challenge.distance;
  const distanceKm = Number.isFinite(+distAny) ? +distAny : 0;

  return {
    user: {
      id: Number.isFinite(+user.id) ? +user.id : null,
      name: user.name || '',
      email: user.email || '',
      stepLength: Number.isFinite(+user.stepLength) ? +user.stepLength : 0,
    },
    team: {
      id: Number.isFinite(+team.id) ? +team.id : null,
      name: team.name || '',
    },
    challenge: {
      id: Number.isFinite(+challenge.id) ? +challenge.id : null,
      name: challenge.name || '',
      startLocation: challenge.startLocation || '',
      targetLocation: challenge.targetLocation || '',
      distanceKm,
      startDate: start,
      endDate: end,
      state: challenge.state || '',
      daysLeft,
      timeProgress,
    },
    steps_this_week: parseStepsThisWeek(data.steps_this_week, pivotMonday),
  };
};
