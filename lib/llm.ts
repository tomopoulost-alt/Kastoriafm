import OpenAI from "openai";
import type {
  CarouselSlide,
  NewsArticle,
  PersonalizedProtocol,
  QuizAnswers,
} from "./types";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

function fallbackProtocol(answers: QuizAnswers): PersonalizedProtocol {
  const goalCopy: Record<QuizAnswers["goal"], string> = {
    energy: "stable daytime energy without the afternoon crash",
    recovery: "faster recovery between hard training days",
    focus: "cleaner cognitive output under load",
    metabolic: "tighter metabolic flexibility and body composition",
    longevity: "long-horizon healthspan and resilience",
  };

  return {
    headline: `${answers.firstName}'s 14-Day Longevity Protocol`,
    summary: `Built around ${goalCopy[answers.goal]}, with sleep quality rated ${answers.sleepQuality} and stress at ${answers.stressLevel}.`,
    focusAreas: [
      `Primary goal: ${answers.goal}`,
      `Training load: ${answers.activityLevel}`,
      `Sleep baseline: ${answers.sleepQuality}`,
      `Stress load: ${answers.stressLevel}`,
    ],
    morning: {
      title: "Morning Activation",
      items: [
        "Get outdoor light within 30 minutes of waking",
        "Hydrate with electrolytes before caffeine",
        answers.goal === "focus"
          ? "Delay caffeine 60–90 minutes after waking"
          : "Protein-forward breakfast (30–40g)",
        "5-minute mobility flow for hips and thoracic spine",
      ],
    },
    midday: {
      title: "Midday Performance",
      items: [
        "Walk 10–15 minutes after your largest meal",
        answers.activityLevel === "elite" || answers.activityLevel === "high"
          ? "Protect one Zone 2 block (30–45 min)"
          : "Accumulate 7–8k steps before dinner",
        "Protein + fiber lunch to blunt glucose volatility",
        answers.stressLevel === "high" || answers.stressLevel === "chronic"
          ? "Box breathing x 4 rounds before your hardest deep-work block"
          : "Single deep-work block with notifications off",
      ],
    },
    evening: {
      title: "Evening Wind-Down",
      items: [
        answers.sleepQuality === "poor" || answers.sleepQuality === "fair"
          ? "Hard stop on screens 60 minutes before bed"
          : "Dim lights and keep bedroom cool (17–19°C)",
        "Finish last meal 3 hours before sleep when possible",
        "Magnesium glycinate or similar if already tolerated",
        "Write tomorrow’s top 3 priorities to offload cognitive load",
      ],
    },
    weekly: {
      title: "Weekly Architecture",
      items: [
        "2–3 resistance sessions covering push, pull, hinge, squat",
        "1 longer Zone 2 session (45–75 min)",
        "1 full recovery day with walks only",
        "Sunday 20-minute protocol review and next-week calendar block",
      ],
    },
    cautions: [
      "This protocol is educational, not medical advice.",
      answers.supplements.length
        ? `Existing stack noted: ${answers.supplements.join(", ")}. Do not stack duplicates without clinician guidance.`
        : "Introduce at most one new habit or supplement every 3–4 days.",
      "Stop and seek clinical care for chest pain, dizziness, or unexplained fatigue.",
    ],
  };
}

function fallbackCarousel(articles: NewsArticle[]): CarouselSlide[] {
  const lead = articles[0];
  return [
    {
      eyebrow: "Longevity Brief",
      title: lead?.title ?? "Today in Longevity Science",
      body: lead?.excerpt ?? "Fresh signals from recovery, metabolism, and performance research.",
      footer: "Kastoria Performance",
    },
    {
      eyebrow: "Signal",
      title: "What changed",
      body: articles
        .slice(0, 3)
        .map((a) => `• ${a.title}`)
        .join("\n") || "• Sleep regularity remains the highest-leverage daily lever",
    },
    {
      eyebrow: "Action",
      title: "Do this today",
      body: "Protect a consistent wake time, walk after your largest meal, and keep one hard training stimulus — not three.",
      footer: "Save for later",
    },
  ];
}

export async function generateProtocol(
  answers: QuizAnswers,
): Promise<PersonalizedProtocol> {
  const client = getClient();
  if (!client) {
    return fallbackProtocol(answers);
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a longevity and performance coach. Return strict JSON matching keys: headline, summary, focusAreas (string[]), morning/midday/evening/weekly ({title, items:string[]}), cautions (string[]). Keep language concrete and non-medical.",
      },
      {
        role: "user",
        content: JSON.stringify(answers),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    return fallbackProtocol(answers);
  }

  try {
    return JSON.parse(raw) as PersonalizedProtocol;
  } catch {
    return fallbackProtocol(answers);
  }
}

export async function summarizeNews(
  articles: NewsArticle[],
): Promise<{
  headline: string;
  summary: string;
  keyTakeaways: string[];
  carouselSlides: CarouselSlide[];
}> {
  const client = getClient();
  if (!client || articles.length === 0) {
    return {
      headline: articles[0]?.title ?? "Longevity Daily Brief",
      summary:
        articles[0]?.excerpt ??
        "A concise scan of longevity, recovery, and metabolic performance research.",
      keyTakeaways: articles.slice(0, 3).map((a) => a.title),
      carouselSlides: fallbackCarousel(articles),
    };
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Summarize longevity/performance news for social carousels. Return JSON with headline, summary, keyTakeaways (3-5 strings), carouselSlides (array of {eyebrow,title,body,footer?}) with exactly 5 slides. Keep copy punchy and evidence-aware.",
      },
      {
        role: "user",
        content: JSON.stringify(articles.slice(0, 8)),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    return {
      headline: articles[0].title,
      summary: articles[0].excerpt,
      keyTakeaways: articles.slice(0, 3).map((a) => a.title),
      carouselSlides: fallbackCarousel(articles),
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      headline: string;
      summary: string;
      keyTakeaways: string[];
      carouselSlides: CarouselSlide[];
    };
    if (!parsed.carouselSlides?.length) {
      parsed.carouselSlides = fallbackCarousel(articles);
    }
    return parsed;
  } catch {
    return {
      headline: articles[0].title,
      summary: articles[0].excerpt,
      keyTakeaways: articles.slice(0, 3).map((a) => a.title),
      carouselSlides: fallbackCarousel(articles),
    };
  }
}
