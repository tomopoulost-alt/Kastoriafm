"use client";

import { useEffect, useMemo, useState } from "react";
import type { CarouselSlide, NewsBrief } from "@/lib/types";
import styles from "./carousel.module.css";

const FALLBACK_SLIDES: CarouselSlide[] = [
  {
    eyebrow: "Longevity Brief",
    title: "Train the base. Protect the night.",
    body: "Today’s signal stack: sleep regularity, Zone 2 volume, and protein distribution.",
    footer: "Kastoria Performance",
  },
  {
    eyebrow: "Signal 01",
    title: "Sleep midpoint beats duration",
    body: "A stable mid-sleep point tracks with cleaner metabolic markers than raw hours alone.",
  },
  {
    eyebrow: "Signal 02",
    title: "Zone 2 still compounds",
    body: "Mitochondrial density responds to repeatable moderate aerobic work under hard sessions.",
  },
  {
    eyebrow: "Signal 03",
    title: "Protein across the day",
    body: "Older athletes benefit more from spread intake than a single late bolus.",
  },
  {
    eyebrow: "Action",
    title: "Do this in 24 hours",
    body: "Fix wake time. Walk after lunch. Keep one hard stimulus — not three.",
    footer: "Save • Share • Apply",
  },
];

export default function CarouselTemplatePage() {
  const [slides, setSlides] = useState<CarouselSlide[]>(FALLBACK_SLIDES);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<string>("Seed brief");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/news-generator");
        if (!response.ok) throw new Error("news failed");
        const brief = (await response.json()) as NewsBrief;
        if (cancelled) return;
        if (brief.carouselSlides?.length) {
          setSlides(brief.carouselSlides.slice(0, 5));
          setMeta(brief.headline);
        }
      } catch {
        if (!cancelled) setMeta("Offline seed brief");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onSetSlide = (event: Event) => {
      const detail = (event as CustomEvent<{ index: number }>).detail;
      if (typeof detail?.index === "number") {
        setActive(detail.index);
      }
    };
    window.addEventListener("lpe:set-slide", onSetSlide);
    return () => window.removeEventListener("lpe:set-slide", onSetSlide);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.activeSlide = String(active);
  }, [active]);

  const slide = useMemo(() => slides[active] ?? slides[0], [slides, active]);

  return (
    <main className={styles.stage}>
      <article className={styles.canvas} data-testid="carousel-canvas">
        <div className={styles.glow} />
        <div className={styles.grid} />
        <header className={styles.top}>
          <span className={styles.brand}>Kastoria</span>
          <span className={styles.badge}>{loading ? "Loading" : "Live brief"}</span>
        </header>

        <div className={styles.content} key={active}>
          <p className={styles.eyebrow}>{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p className={styles.body}>{slide.body}</p>
        </div>

        <footer className={styles.bottom}>
          <div className={styles.dots}>
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Slide ${index + 1}`}
                className={index === active ? styles.dotActive : styles.dot}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
          <span className={styles.footerText}>
            {slide.footer ?? meta}
          </span>
        </footer>
      </article>

      <aside className={styles.controls}>
        <p>1080 × 1350 dark branded template</p>
        <div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setActive((a) => Math.max(0, a - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn btn-signal"
            onClick={() => setActive((a) => Math.min(slides.length - 1, a + 1))}
          >
            Next
          </button>
        </div>
      </aside>
    </main>
  );
}
