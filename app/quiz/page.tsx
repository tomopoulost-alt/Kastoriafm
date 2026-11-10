"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { PersonalizedProtocol, QuizAnswers } from "@/lib/types";
import styles from "./quiz.module.css";

const STEPS = [
  "Identity",
  "Goal",
  "Training",
  "Recovery",
  "Stack",
] as const;

const GOAL_OPTIONS: { value: QuizAnswers["goal"]; label: string; hint: string }[] = [
  { value: "energy", label: "Daytime energy", hint: "Stable output, fewer crashes" },
  { value: "recovery", label: "Recovery speed", hint: "Bounce back between sessions" },
  { value: "focus", label: "Cognitive focus", hint: "Cleaner deep work" },
  { value: "metabolic", label: "Metabolic control", hint: "Body composition & glucose" },
  { value: "longevity", label: "Healthspan", hint: "Long-horizon resilience" },
];

const ACTIVITY_OPTIONS: QuizAnswers["activityLevel"][] = [
  "sedentary",
  "light",
  "moderate",
  "high",
  "elite",
];

const SLEEP_OPTIONS: QuizAnswers["sleepQuality"][] = [
  "poor",
  "fair",
  "good",
  "excellent",
];

const STRESS_OPTIONS: QuizAnswers["stressLevel"][] = [
  "low",
  "moderate",
  "high",
  "chronic",
];

const SUPPLEMENT_OPTIONS = [
  "Creatine",
  "Omega-3",
  "Vitamin D",
  "Magnesium",
  "Protein powder",
  "None",
];

const initial: QuizAnswers = {
  email: "",
  firstName: "",
  age: 35,
  goal: "longevity",
  activityLevel: "moderate",
  sleepQuality: "fair",
  stressLevel: "moderate",
  supplements: [],
  notes: "",
};

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(initial);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<PersonalizedProtocol | null>(null);
  const [pdfHref, setPdfHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  function update<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSupplement(item: string) {
    setAnswers((prev) => {
      if (item === "None") {
        return { ...prev, supplements: [] };
      }
      const withoutNone = prev.supplements.filter((s) => s !== "None");
      const exists = withoutNone.includes(item);
      return {
        ...prev,
        supplements: exists
          ? withoutNone.filter((s) => s !== item)
          : [...withoutNone, item],
      };
    });
  }

  function canContinue(): boolean {
    if (step === 0) {
      return Boolean(answers.firstName.trim() && answers.email.includes("@"));
    }
    return true;
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/quiz-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Submission failed");
        }
        setProtocol(data.protocol as PersonalizedProtocol);
        const payload = btoa(unescape(encodeURIComponent(JSON.stringify(data.protocol))))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        setPdfHref(
          `/api/pdf-render?name=${encodeURIComponent(answers.firstName)}&goal=${answers.goal}&payload=${payload}`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (protocol) {
    return (
      <main className={styles.page}>
        <div className={`site-shell ${styles.result}`}>
          <Link href="/" className={`brand-mark ${styles.back}`}>
            Kastoria
          </Link>
          <p className="eyebrow">Protocol ready</p>
          <h1>{protocol.headline}</h1>
          <p className={styles.summary}>{protocol.summary}</p>
          <div className={styles.blocks}>
            {[protocol.morning, protocol.midday, protocol.evening, protocol.weekly].map(
              (block) => (
                <section key={block.title}>
                  <h2>{block.title}</h2>
                  <ul>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
          <div className={styles.actions}>
            {pdfHref ? (
              <a className="btn btn-signal" href={pdfHref}>
                Download PDF
              </a>
            ) : null}
            <Link className="btn btn-ghost" href="/templates/carousel">
              Open carousel template
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={`site-shell ${styles.shell}`}>
        <header className={styles.header}>
          <Link href="/" className="brand-mark">
            Kastoria
          </Link>
          <div className={styles.stepMeta}>
            <span>
              Step {step + 1} / {STEPS.length}
            </span>
            <strong>{STEPS[step]}</strong>
          </div>
        </header>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={`${styles.panel} rise`} key={step}>
          {step === 0 ? (
            <>
              <h1>Who is this protocol for?</h1>
              <p>We’ll personalize training, recovery, and evening wind-down.</p>
              <label>
                First name
                <input
                  value={answers.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Alex"
                  autoComplete="given-name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={answers.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={answers.age}
                  onChange={(e) => update("age", Number(e.target.value))}
                />
              </label>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <h1>What should we optimize first?</h1>
              <p>Pick the outcome that would change the next 30 days most.</p>
              <div className={styles.optionGrid}>
                {GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      answers.goal === option.value
                        ? styles.optionActive
                        : styles.option
                    }
                    onClick={() => update("goal", option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.hint}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1>How hard are you training?</h1>
              <p>This sets Zone 2 volume and recovery pressure.</p>
              <div className={styles.chipRow}>
                {ACTIVITY_OPTIONS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={
                      answers.activityLevel === level
                        ? styles.chipActive
                        : styles.chip
                    }
                    onClick={() => update("activityLevel", level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h1>How are sleep and stress?</h1>
              <p>Recovery capacity decides how aggressive the protocol can be.</p>
              <h2>Sleep quality</h2>
              <div className={styles.chipRow}>
                {SLEEP_OPTIONS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={
                      answers.sleepQuality === level
                        ? styles.chipActive
                        : styles.chip
                    }
                    onClick={() => update("sleepQuality", level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <h2>Stress load</h2>
              <div className={styles.chipRow}>
                {STRESS_OPTIONS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={
                      answers.stressLevel === level
                        ? styles.chipActive
                        : styles.chip
                    }
                    onClick={() => update("stressLevel", level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <h1>Current stack</h1>
              <p>Select anything you already take. We’ll avoid duplicate advice.</p>
              <div className={styles.chipRow}>
                {SUPPLEMENT_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      (item === "None" && answers.supplements.length === 0) ||
                      answers.supplements.includes(item)
                        ? styles.chipActive
                        : styles.chip
                    }
                    onClick={() => toggleSupplement(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <label>
                Notes (optional)
                <textarea
                  rows={3}
                  value={answers.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Injuries, travel weeks, fasting windows…"
                />
              </label>
            </>
          ) : null}
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <footer className={styles.footer}>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={step === 0 || isPending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-signal"
              disabled={!canContinue()}
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-signal"
              disabled={isPending || !canContinue()}
              onClick={submit}
            >
              {isPending ? "Building protocol…" : "Generate protocol"}
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}
