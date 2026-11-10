# Kastoria Longevity Performance Engine

Content and conversion engine for longevity/performance marketing:

- scrape + summarize daily research into carousel copy
- run a 5-step longevity quiz into a personalized protocol
- render branded PDF protocols with headless Chrome
- optionally push quiz completions into Klaviyo

## Structure

```text
app/
  api/
    news-generator/route.ts   # Scraper + LLM summarizer
    quiz-submit/route.ts      # Longevity quiz handler
    pdf-render/route.ts       # Puppeteer PDF generator
  quiz/page.tsx               # 5-step longevity quiz
  templates/
    carousel/page.tsx         # Dark branded template (1080×1350)
    pdf-protocol/page.tsx     # Clean PDF document template
lib/
  puppeteer.ts                # Headless Chrome instance
  llm.ts                      # OpenAI wrapper + local fallbacks
  klaviyo.ts                  # Klaviyo event / webhook client
  news.ts                     # RSS scraper
scripts/
  auto-news-cron.ts           # Daily cron runner
```

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open:

- `/` — landing
- `/quiz` — longevity quiz
- `/templates/carousel` — dark social canvas
- `/templates/pdf-protocol` — printable protocol
- `/api/news-generator` — JSON brief
- `/api/pdf-render?name=Alex` — PDF download

## Cron

With the app running:

```bash
npm run cron:news
```

Writes `output/news-brief-<timestamp>.json`.

## Environment

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables live LLM summaries/protocols |
| `KLAVIYO_PRIVATE_API_KEY` | Sends quiz completion events |
| `KLAVIYO_WEBHOOK_URL` | Optional secondary webhook |
| `PUPPETEER_EXECUTABLE_PATH` | Chrome binary for PDF rendering |
| `NEXT_PUBLIC_APP_URL` | Absolute origin used by PDF renderer |
