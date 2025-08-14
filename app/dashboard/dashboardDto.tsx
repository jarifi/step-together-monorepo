export type HomeInitDto = {
  user: {
    id: number | null;
    name: string;
    email: string;
    stepLength: number; 
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
    distanceKm: number;   
    startDate: Date | null;
    endDate: Date | null;
    state: string;
    daysLeft: number;     
    timeProgress: number;
  };
  steps_this_week?: number[];
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toDate = (iso?: string | null) => (iso ? new Date(iso) : null);
const daysBetween = (a: Date, b: Date) =>
  Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

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

  // ⬇️ steps_this_week kommt als Array, ggf. kürzer (z.B. 4 Tage) -> auf 7 auffüllen
  const rawWeek = Array.isArray(data.steps_this_week)
    ? data.steps_this_week.map((n: any) => (Number.isFinite(+n) ? +n : 0))
    : [];
  const week7 = Array.from({ length: 7 }, (_, i) => rawWeek[i] ?? 0);

  return {
    user: {
      id: user.id ?? null,
      name: user.name ?? '',
      email: user.email ?? '',
      stepLength: typeof user.stepLength === 'number' ? user.stepLength : 0,
    },
    team: {
      id: team.id ?? null,
      name: team.name ?? '',
    },
    challenge: {
      id: challenge.id ?? null,
      name: challenge.name ?? '',
      startLocation: challenge.startLocation ?? '',
      targetLocation: challenge.targetLocation ?? '',
      distanceKm: typeof challenge.distance === 'number' ? challenge.distance : 0, // passt zu deinem JSON
      startDate: start,
      endDate: end,
      state: challenge.state ?? '',
      daysLeft,
      timeProgress,
    },
    steps_this_week: week7,
  };
};
