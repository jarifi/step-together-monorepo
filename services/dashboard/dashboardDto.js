const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const toDate = (iso) => (iso ? new Date(iso) : null);

// ISO "YYYY-MM-DD" → lokal (UTC-Shift vermeiden)
const fromIsoLocal = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
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

const daysBetween = (a, b) => Math.ceil((b - a) / (1000 * 60 * 60 * 24));
const dayLabelDe = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
const dayLabelEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeDayOfWeek = (val) => {
  if (!val) return null;
  const s = String(val).toLowerCase();
  const enIdx = dayLabelEn.findIndex((d) => d.toLowerCase() === s);
  if (enIdx >= 0) return dayLabelDe[enIdx];
  const deIdx = dayLabelDe.findIndex((d) => d.toLowerCase() === s);
  return deIdx >= 0 ? dayLabelDe[deIdx] : null;
};

// ======================
// Exakt die Pivot-Woche mappen (Mo..So)
//  - raw: number[] ODER object[]
//  - pivotMonday: Montag-Datum der Zielwoche
// ======================
export const parseStepsThisWeek = (raw, pivotMonday) => {
  const baseMonday = mondayOf(pivotMonday || new Date());
  const sums = new Array(7).fill(0);

  const addAtIdx = (idx, v) => {
    if (idx >= 0 && idx < 7) sums[idx] += Math.max(0, Math.floor(Number(v) || 0));
  };

  if (Array.isArray(raw) && raw.length > 0) {
    if (typeof raw[0] === 'number') {
      // number[]: Index 0..6 → Mo..So relativ zur Pivot
      raw.slice(0, 7).forEach((n, i) => addAtIdx(i, n));
    } else {
      // object[]: { date?, dayOfWeek?, numberOfSteps|steps? }
      for (const e of raw) {
        const val = e?.numberOfSteps ?? e?.steps ?? 0;
        let idx = -1;

        if (e?.date) {
          const d = fromIsoLocal(e.date);
          // Nur zählen, wenn Datum in der Pivot-Woche liegt
          const offsetDays = Math.floor((mondayOf(d) - baseMonday) / (1000 * 60 * 60 * 24));
          if (offsetDays === 0) idx = (d.getDay() + 6) % 7;
        }
        // Fallback: dayOfWeek (EN/DE)
        if (idx < 0 && e?.dayOfWeek) {
          const de = normalizeDayOfWeek(e.dayOfWeek);
          idx = dayLabelDe.indexOf(de ?? '');
        }
        addAtIdx(idx, val);
      }
    }
  }

  // Ausgabe als vollständige Woche (Objekte)
  return sums.map((n, i) => {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + i);
    return { date: toIsoDate(d), dayOfWeek: dayLabelDe[i], numberOfSteps: n };
  });
};

// ======================
// Main Mapper
//  - optional pivotMonday, um steps_this_week korrekt zu bauen
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
    const span = end - start;
    timeProgress = clamp01((now - start) / span);
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
    steps_this_week: parseStepsThisWeek(
      data.steps_this_week,
      pivotMonday ?? mondayOf(new Date())
    ),
  };
};
