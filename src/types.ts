export type DurationMinutes = 15 | 25 | 45 | 90;

export type View = "home" | "setup" | "session" | "done" | "history";

export interface SessionRecord {
  id: string;
  intention: string;
  durationMinutes: DurationMinutes;
  completedMinutes: number;
  startedAt: string;
  endedAt: string;
  note?: string;
}

export interface ActiveSession {
  intention: string;
  durationMinutes: DurationMinutes;
  startedAt: number;
  endsAt: number;
}
