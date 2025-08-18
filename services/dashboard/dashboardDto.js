// ======================
// Helpers
// ======================
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const toDate = (iso) => (iso ? new Date(iso) : null);
const daysBetween = (a, b) => Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const dayLabelDe = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
const dayLabelEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const mondayOf = (d) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (c.getDay() + 6) % 7; // 0=Mo..6=So
  c.setDate(c.getDate() - dow);
  c.setHours(0, 0, 0, 0);
  return c;
};

const deFromDate = (iso) => {
  const dd = new Date(iso);
  const dow = (dd.getDay() + 6) % 7; // 0..6
  return dayLabelDe[dow];
};

const normalizeDayOfWeek = (val) => {
  if (!val) return null;
  const s = String(val).toLowerCase();
  const enIdx = dayLabelEn.findIndex((d) => d.toLowerCase() === s);
  if (enIdx >= 0) return dayLabelDe[enIdx];
  const deIdx = dayLabelDe.findIndex((d) => d.toLowerCase() === s);
  return deIdx >= 0 ? dayLabelDe[deIdx] : null;
};

// ======================
// Steps-Parser
//  - akzeptiert number[] oder object[]
//  - normalisiert dayOfWeek -> DE ('MO'..'SO')
//  - füllt die Woche Mo-So vollständig (fehlende Tage = 0)
// ======================
const parseStepsThisWeek = (raw) => {
  const asObjects = (() => {
    if (!Array.isArray(raw)) return [];

    if (raw.length > 0 && typeof raw[0] === 'number') {
      // number[] → auf aktuelle Woche legen
      const base = mondayOf(new Date());
      return raw.slice(0, 7).map((n, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return {
          date: toIsoDate(d),
          dayOfWeek: dayLabelDe[i],
          numberOfSteps: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0,
        };
      });
    }

    // object[]
    return raw.map((e) => {
      const date = typeof e?.date === 'string' && e.date ? e.date : toIsoDate(new Date());
      const fromPayload = normalizeDayOfWeek(e?.dayOfWeek);
      const dayOfWeek = fromPayload ?? deFromDate(date);
      const stepsRaw = typeof e?.numberOfSteps !== 'undefined' ? Number(e.numberOfSteps) : Number(e?.steps);
      const numberOfSteps = Number.isFinite(stepsRaw) ? Math.max(0, Math.floor(stepsRaw)) : 0;
      return { date, dayOfWeek, numberOfSteps };
    });
  })();

  // Montag der Zielwoche bestimmen
  let baseMonday = mondayOf(new Date());
  if (asObjects.length) {
    const minDate = asObjects
      .map((e) => new Date(e.date))
      .reduce((min, d) => (d < min ? d : min), new Date(asObjects[0].date));
    baseMonday = mondayOf(minDate);
  }

  // Per 'MO'..'SO' zusammenfassen
  const byKey = new Map();
  for (const e of asObjects) {
    byKey.set(e.dayOfWeek, (byKey.get(e.dayOfWeek) ?? 0) + e.numberOfSteps);
  }

  // Woche vollständig aufbauen (Mo..So), fehlende = 0
  const fullWeek = dayLabelDe.map((label, i) => {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + i);
    return {
      date: toIsoDate(d),
      dayOfWeek: label,
      numberOfSteps: byKey.get(label) ?? 0,
    };
  });

  return fullWeek;
};

// ======================
// Main Mapper
// ======================
export const mapHomeInitToDashboard = (data) => {
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

  // distance flexibel akzeptieren (distance | distanceKm)
  const distAny =
    typeof challenge.distanceKm === 'number'
      ? challenge.distanceKm
      : typeof challenge.distance === 'number'
      ? challenge.distance
      : Number(challenge.distanceKm ?? challenge.distance);
  const distanceKm = Number.isFinite(distAny) ? Number(distAny) : 0;

  return {
    user: {
      id: Number.isFinite(user.id) ? Number(user.id) : null,
      name: typeof user.name === 'string' ? user.name : '',
      email: typeof user.email === 'string' ? user.email : '',
      stepLength:
        typeof user.stepLength === 'number' && Number.isFinite(user.stepLength) ? user.stepLength : 0,
    },
    team: {
      id: Number.isFinite(team.id) ? Number(team.id) : null,
      name: typeof team.name === 'string' ? team.name : '',
    },
    challenge: {
      id: Number.isFinite(challenge.id) ? Number(challenge.id) : null,
      name: typeof challenge.name === 'string' ? challenge.name : '',
      startLocation: typeof challenge.startLocation === 'string' ? challenge.startLocation : '',
      targetLocation: typeof challenge.targetLocation === 'string' ? challenge.targetLocation : '',
      distanceKm,
      startDate: start,
      endDate: end,
      state: typeof challenge.state === 'string' ? challenge.state : '',
      daysLeft,
      timeProgress,
    },
    steps_this_week: parseStepsThisWeek(data.steps_this_week),
  };
};
