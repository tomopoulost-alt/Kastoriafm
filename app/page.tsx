import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main>
      <header className={styles.nav}>
        <div className={`site-shell ${styles.navInner}`}>
          <span className="brand-mark">Kastoria</span>
          <nav className={styles.navLinks}>
            <Link href="/quiz">Quiz</Link>
            <Link href="/templates/carousel">Carousel</Link>
            <Link href="/templates/pdf-protocol">Protocol PDF</Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={`site-shell ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={`eyebrow rise`}>Longevity Performance Engine</p>
            <h1 className={`brand-mark rise rise-delay-1 ${styles.heroBrand}`}>
              Kastoria
            </h1>
            <p className={`rise rise-delay-2 ${styles.heroLead}`}>
              Turn daily research into branded carousels, quizzes into protocols,
              and protocols into print-ready PDFs.
            </p>
            <div className={`rise rise-delay-3 ${styles.ctaRow}`}>
              <Link className="btn btn-signal" href="/quiz">
                Start the 5-step quiz
              </Link>
              <Link className="btn btn-ghost" href="/api/news-generator">
                Generate today’s brief
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={styles.panel}>
              <span>1080 × 1350</span>
              <strong>Dark carousel engine</strong>
              <em>News → LLM → slides</em>
            </div>
            <div className={styles.panelSecondary}>
              <span>A4</span>
              <strong>Protocol PDF</strong>
              <em>Puppeteer render</em>
            </div>
          </div>
        </div>
      </section>

      <section className={`site-shell ${styles.section}`}>
        <h2>One pipeline. Three outputs.</h2>
        <p className={styles.sectionLead}>
          Scrape longevity news, score a quiz, and ship polished assets without a
          separate design sprint every morning.
        </p>
        <div className={styles.featureList}>
          <article>
            <h3>News generator</h3>
            <p>RSS scrape + LLM summary into carousel-ready copy.</p>
          </article>
          <article>
            <h3>Longevity quiz</h3>
            <p>Five steps, personalized protocol, Klaviyo event handoff.</p>
          </article>
          <article>
            <h3>PDF render</h3>
            <p>Headless Chrome turns the protocol template into a download.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
