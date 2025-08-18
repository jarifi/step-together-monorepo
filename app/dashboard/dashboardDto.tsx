// ======================
// Types
// ======================
export type HomeInitDto = {
  user: {
    id: number | null;
    name: string;
    email: string;
    stepLength: number; // in meters/step (oder was auch immer eure API nutzt)
  };
  team: {
    id: number | null;
    name: string;
  };
  challenge: {
    id: number | null;
    name: string;
    startLocation: string;
    targetLocation: string;
    distanceKm: number;    // konsistent in KM
    startDate: Date | null;
    endDate: Date | null;
    state: string;
    daysLeft: number;      // >= 0
    timeProgress: number;  // 0..1
  };
  steps_this_week?: {
    date: string;          // ISO yyyy-mm-dd
    dayOfWeek: string;     // 'MO'..'SO'
    numberOfSteps: number;
  }[];
};

// ======================
// Helpers
// ======================
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toDate = (iso?: string | null) => (iso ? new Date(iso) : null);
const daysBetween = (a: Date, b: Date) =>
  Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

// Montag-Start der Woche
const startOfWeekMonday = (d: Date) => {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7; // 0 = Mo .. 6 = So
  copy.setDate(copy.getDate() - dow);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const dayLabelDe = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'] as const;

const toIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ======================
// Flexible Steps-Parser
// Unterstützt:
// 1) Array<number>   -> [20,10,80,...] (Mo..)
// 2) Array<object>   -> [{date, dayOfWeek, numberOfSteps}, ...]
// Alles wird in das einheitliche Objektformat gemappt.
// ======================
const parseStepsThisWeek = (raw: unknown): HomeInitDto['steps_this_week'] => {
  if (!Array.isArray(raw)) return [];

  // Case 1: Array<number>
  if (raw.length > 0 && typeof raw[0] === 'number') {
    const base = startOfWeekMonday(new Date());
    return (raw as number[]).slice(0, 7).map((n, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        date: toIsoDate(d),
        dayOfWeek: dayLabelDe[i],
        numberOfSteps: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0,
      };
    });
  }

  // Case 2: Array<object>
  return (raw as any[]).map((entry, idx) => {
    const parsedDate =
      typeof entry?.date === 'string' && entry.date
        ? entry.date
        : toIsoDate(new Date()); // Fallback: heute

    // dayOfWeek ggf. aus date ableiten
    let dayOfWeek = entry?.dayOfWeek;
    if (!dayOfWeek) {
      const d = new Date(parsedDate);
      const dow = (d.getDay() + 6) % 7; // 0..6
      dayOfWeek = dayLabelDe[dow];
    }

    const stepsRaw =
      typeof entry?.numberOfSteps !== 'undefined'
        ? Number(entry.numberOfSteps)
        : Number(entry?.steps); // toleranter key

    const numberOfSteps = Number.isFinite(stepsRaw) ? Math.max(0, Math.floor(stepsRaw)) : 0;

    return {
      date: parsedDate,
      dayOfWeek,
      numberOfSteps,
    };
  });
};

// ======================
// Main Mapper
// Erwartet "data" aus deiner API. Ist fehlertolerant bei Keys:
// - distance / distanceKm
// - steps_this_week als numbers[] ODER objects[]
// ======================
export const mapHomeInitToDashboard = (data: any): HomeInitDto | null => {
  if (!data) return null;

  const { user = {}, team = {}, challenge = {} } = data;

  const start = toDate(challenge.startDate);
  const end = toDate(challenge.endDate);
  const now = new Date();

  let daysLeft = 0;
  let timeProgress = 0;

  if (start && end && end > start) {
    const totalMs = end.getTime() - start.getTime();
    timeProgress = clamp01((now.getTime() - start.getTime()) / totalMs);
    daysLeft = Math.max(0, daysBetween(now, end));
  }

  // distance flexibel lesen & sauber nach number casten
  const distanceCandidate =
    typeof challenge.distanceKm === 'number'
      ? challenge.distanceKm
      : typeof challenge.distance === 'number'
      ? challenge.distance
      : Number(challenge.distanceKm ?? challenge.distance);

  const distanceKm = Number.isFinite(distanceCandidate) ? Number(distanceCandidate) : 0;

  const stepsWeek = parseStepsThisWeek(data.steps_this_week);

  return {
    user: {
      id: Number.isFinite(user.id) ? Number(user.id) : null,
      name: typeof user.name === 'string' ? user.name : '',
      email: typeof user.email === 'string' ? user.email : '',
      stepLength:
        typeof user.stepLength === 'number' && Number.isFinite(user.stepLength)
          ? user.stepLength
          : 0,
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
    steps_this_week: stepsWeek,
  };
};
