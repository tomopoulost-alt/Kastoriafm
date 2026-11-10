import type { SessionRecord } from "./types";

const KEY = "still.sessions.v1";

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function addSession(session: SessionRecord): SessionRecord[] {
  const next = [session, ...loadSessions()].slice(0, 200);
  saveSessions(next);
  return next;
}

export function clearSessions(): void {
  localStorage.removeItem(KEY);
}

export function minutesThisWeek(sessions: SessionRecord[], now = new Date()): number {
  const start = startOfWeek(now);
  return sessions
    .filter((s) => new Date(s.endedAt) >= start)
    .reduce((sum, s) => sum + s.completedMinutes, 0);
}

export function dayBuckets(sessions: SessionRecord[], now = new Date()): { label: string; minutes: number; isToday: boolean }[] {
  const start = startOfWeek(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return days.map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const minutes = sessions
      .filter((s) => {
        const t = new Date(s.endedAt);
        return t >= day && t < next;
      })
      .reduce((sum, s) => sum + s.completedMinutes, 0);

    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      minutes,
      isToday: sameDay(day, now),
    };
  });
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
