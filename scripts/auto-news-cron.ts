#!/usr/bin/env tsx
/**
 * Daily cron runner for the longevity news brief.
 *
 * Usage:
 *   npm run cron:news
 *   CRON_BASE_URL=http://localhost:3000 npm run cron:news
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.CRON_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

async function main() {
  const started = new Date();
  console.log(`[auto-news-cron] fetching brief from ${baseUrl}/api/news-generator`);

  const response = await fetch(`${baseUrl}/api/news-generator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "auto-news-cron" }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`News generator failed (${response.status}): ${detail}`);
  }

  const brief = await response.json();
  const outDir = path.join(process.cwd(), "output");
  await mkdir(outDir, { recursive: true });

  const stamp = started.toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `news-brief-${stamp}.json`);
  await writeFile(outFile, JSON.stringify(brief, null, 2), "utf8");

  console.log(`[auto-news-cron] wrote ${outFile}`);
  console.log(`[auto-news-cron] headline: ${brief.headline}`);
  console.log(
    `[auto-news-cron] slides: ${brief.carouselSlides?.length ?? 0}, sources: ${brief.sourceArticles?.length ?? 0}`,
  );
}

main().catch((error) => {
  console.error("[auto-news-cron] failed", error);
  process.exitCode = 1;
});
