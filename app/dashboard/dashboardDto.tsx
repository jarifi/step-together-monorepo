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
      distanceKm: typeof challenge.distance === 'number' ? challenge.distance : 0,
      startDate: start,
      endDate: end,
      state: challenge.state ?? '',
      daysLeft,
      timeProgress,
    },
  };
};
