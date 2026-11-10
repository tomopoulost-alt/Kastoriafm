import { useEffect, useMemo, useState } from "react";
import {
  addSession,
  dayBuckets,
  loadSessions,
  minutesThisWeek,
  saveSessions,
} from "./storage";
import type {
  ActiveSession,
  DurationMinutes,
  SessionRecord,
  View,
} from "./types";

const DURATIONS: DurationMinutes[] = [15, 25, 45, 90];

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [sessions, setSessions] = useState<SessionRecord[]>(() => loadSessions());
  const [duration, setDuration] = useState<DurationMinutes>(45);
  const [intention, setIntention] = useState("");
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [note, setNote] = useState("");
  const [lastCompleted, setLastCompleted] = useState<SessionRecord | null>(null);

  useEffect(() => {
    if (view !== "session" || !active) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [view, active]);

  useEffect(() => {
    if (view !== "session" || !active) return;
    if (now < active.endsAt) return;

    const completedMinutes = active.durationMinutes;
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      intention: active.intention,
      durationMinutes: active.durationMinutes,
      completedMinutes,
      startedAt: new Date(active.startedAt).toISOString(),
      endedAt: new Date().toISOString(),
    };
    setSessions(addSession(record));
    setLastCompleted(record);
    setActive(null);
    setNote("");
    setView("done");
  }, [now, active, view]);

  const remainingSeconds = useMemo(() => {
    if (!active) return 0;
    return Math.ceil((active.endsAt - now) / 1000);
  }, [active, now]);

  const progress = useMemo(() => {
    if (!active) return 0;
    const total = active.endsAt - active.startedAt;
    const elapsed = Math.min(total, Math.max(0, now - active.startedAt));
    return (elapsed / total) * 100;
  }, [active, now]);

  const weekMinutes = minutesThisWeek(sessions);
  const buckets = dayBuckets(sessions);

  function beginSetup() {
    setIntention("");
    setDuration(45);
    setView("setup");
  }

  function startSession() {
    const trimmed = intention.trim() || "Protect this hour";
    const startedAt = Date.now();
    setActive({
      intention: trimmed,
      durationMinutes: duration,
      startedAt,
      endsAt: startedAt + duration * 60_000,
    });
    setNow(startedAt);
    setView("session");
  }

  function endEarly() {
    if (!active) return;
    const elapsedMs = Date.now() - active.startedAt;
    const completedMinutes = Math.max(1, Math.round(elapsedMs / 60_000));
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      intention: active.intention,
      durationMinutes: active.durationMinutes,
      completedMinutes: Math.min(completedMinutes, active.durationMinutes),
      startedAt: new Date(active.startedAt).toISOString(),
      endedAt: new Date().toISOString(),
    };
    setSessions(addSession(record));
    setLastCompleted(record);
    setActive(null);
    setNote("");
    setView("done");
  }

  function saveNoteAndHome() {
    if (lastCompleted && note.trim()) {
      const updated = loadSessions().map((s) =>
        s.id === lastCompleted.id ? { ...s, note: note.trim() } : s,
      );
      saveSessions(updated);
      setSessions(updated);
    }
    setView("home");
  }

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />
      <div className="mist-layer" aria-hidden="true" />

      <div className="shell">
        <header className="topbar">
          <button
            type="button"
            className="brand-mark"
            onClick={() => {
              if (view !== "session") setView("home");
            }}
          >
            Still
          </button>
          {view !== "session" && view !== "home" && (
            <button type="button" className="ghost-link" onClick={() => setView("home")}>
              Close
            </button>
          )}
          {view === "home" && (
            <button type="button" className="ghost-link" onClick={() => setView("history")}>
              Reclaimed {weekMinutes > 0 ? `· ${formatHours(weekMinutes)}` : ""}
            </button>
          )}
        </header>

        {view === "home" && (
          <section className="hero">
            <h1 className="brand-hero">Still</h1>
            <p className="hero-line">One unbroken stretch of attention.</p>
            <p className="hero-support">
              Agents can wait. Protect the next hour for the work only you can do.
            </p>
            <div className="cta-row">
              <button type="button" className="btn btn-primary" onClick={beginSetup}>
                Begin a Still
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setView("history")}>
                See this week
              </button>
            </div>
          </section>
        )}

        {view === "setup" && (
          <div className="center-wrap">
            <section className="panel" aria-labelledby="setup-title">
              <h2 id="setup-title">Claim the hour</h2>
              <p className="lead">Pick a length. Name what gets your full mind.</p>

              <span className="field-label">Duration</span>
              <div className="duration-grid" role="group" aria-label="Session duration">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="chip"
                    aria-pressed={duration === d}
                    onClick={() => setDuration(d)}
                  >
                    {d}m
                  </button>
                ))}
              </div>

              <label className="field-label" htmlFor="intention">
                Intention
              </label>
              <input
                id="intention"
                className="intention-input"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Ship the draft. Call mom. Read offline."
                maxLength={80}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") startSession();
                }}
              />

              <div className="panel-actions">
                <button type="button" className="btn btn-primary" onClick={startSession}>
                  Enter Still mode
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setView("home")}>
                  Cancel
                </button>
              </div>
            </section>
          </div>
        )}

        {view === "session" && active && (
          <section className="session-stage" aria-live="polite">
            <div
              className="timer-ring"
              style={{ ["--progress" as string]: progress }}
              role="timer"
              aria-label={`${formatClock(remainingSeconds)} remaining`}
            >
              <div className="timer-inner">
                <div className="time-left">{formatClock(remainingSeconds)}</div>
              </div>
            </div>
            <p className="session-intention">{active.intention}</p>
            <div className="session-actions">
              <button type="button" className="btn btn-secondary" onClick={endEarly}>
                End early
              </button>
            </div>
          </section>
        )}

        {view === "done" && lastCompleted && (
          <div className="center-wrap">
            <section className="panel" aria-labelledby="done-title">
              <h2 id="done-title">Reclaimed</h2>
              <p className="done-stat">{formatHours(lastCompleted.completedMinutes)}</p>
              <p className="lead">
                You protected time for “{lastCompleted.intention}”.
              </p>
              <label className="field-label" htmlFor="note">
                Optional note
              </label>
              <textarea
                id="note"
                className="note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What moved while the noise waited?"
                maxLength={240}
              />
              <div className="panel-actions">
                <button type="button" className="btn btn-primary" onClick={saveNoteAndHome}>
                  Done
                </button>
                <button type="button" className="btn btn-secondary" onClick={beginSetup}>
                  Another Still
                </button>
              </div>
            </section>
          </div>
        )}

        {view === "history" && (
          <div className="center-wrap">
            <section className="panel panel-wide" aria-labelledby="history-title">
              <h2 id="history-title">This week</h2>
              <div className="week-summary">
                <p className="lead" style={{ margin: 0 }}>
                  Attention you kept offline from the feed.
                </p>
                <div className="week-total">{formatHours(weekMinutes)}</div>
              </div>

              <div className="bars" aria-hidden={weekMinutes === 0}>
                {buckets.map((day) => {
                  const max = Math.max(45, ...buckets.map((b) => b.minutes));
                  const height = day.minutes === 0 ? 4 : Math.max(10, (day.minutes / max) * 120);
                  return (
                    <div
                      key={day.label}
                      className={`bar-col${day.isToday ? " today" : ""}`}
                      title={`${day.label}: ${formatHours(day.minutes)}`}
                    >
                      <div className="bar-track">
                        <div className="bar-fill" style={{ height }} />
                      </div>
                      <span className="bar-label">{day.label}</span>
                    </div>
                  );
                })}
              </div>

              {sessions.length === 0 ? (
                <p className="empty-copy">No Stills yet. Your first unbroken hour starts above.</p>
              ) : (
                <ul className="history-list">
                  {sessions.slice(0, 12).map((s) => (
                    <li key={s.id} className="history-item">
                      <strong>{s.intention}</strong>
                      <span className="history-meta">
                        {formatHours(s.completedMinutes)} ·{" "}
                        {new Date(s.endedAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {s.note ? ` · ${s.note}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="panel-actions" style={{ marginTop: "1.1rem" }}>
                <button type="button" className="btn btn-primary" onClick={beginSetup}>
                  Begin a Still
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setView("home")}>
                  Back
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
