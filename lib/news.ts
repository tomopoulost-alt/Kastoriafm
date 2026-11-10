import type { NewsArticle } from "./types";

const FEEDS = [
  {
    source: "NIH News",
    url: "https://www.nih.gov/news-events/news-releases/feed.xml",
  },
  {
    source: "Nature Aging",
    url: "https://www.nature.com/nataging.rss",
  },
];

function stripHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
  );
  if (cdata?.[1]) return cdata[1].trim();
  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return plain?.[1]?.trim() ?? "";
}

function parseRssItems(xml: string, source: string): NewsArticle[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return items.slice(0, 6).map((item) => {
    const title = stripHtml(extractTag(item, "title"));
    const link = stripHtml(extractTag(item, "link"));
    const description = stripHtml(extractTag(item, "description"));
    const pubDate = stripHtml(extractTag(item, "pubDate"));
    return {
      title: title || "Untitled brief",
      url: link,
      source,
      publishedAt: pubDate || undefined,
      excerpt: description.slice(0, 280) || title,
    };
  });
}

const SEED_ARTICLES: NewsArticle[] = [
  {
    title: "Sleep regularity predicts healthier biomarkers better than duration alone",
    url: "https://example.com/sleep-regularity",
    source: "Kastoria Research Desk",
    excerpt:
      "Consistent sleep midpoints correlate with improved metabolic and inflammatory markers across adult cohorts.",
  },
  {
    title: "Zone 2 volume remains the durable base for mitochondrial adaptation",
    url: "https://example.com/zone-2",
    source: "Kastoria Research Desk",
    excerpt:
      "Moderate aerobic work continues to show reliable mitochondrial density gains when stacked under high-intensity days.",
  },
  {
    title: "Protein distribution beats late-day protein loading for older adults",
    url: "https://example.com/protein-distribution",
    source: "Kastoria Research Desk",
    excerpt:
      "Spreading 1.6–2.2 g/kg across meals supports muscle protein synthesis more reliably than a single evening bolus.",
  },
];

export async function scrapeLongevityNews(): Promise<NewsArticle[]> {
  const collected: NewsArticle[] = [];

  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8_000);
        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: { "User-Agent": "KastoriaLongevityBot/1.0" },
          cache: "no-store",
        });
        clearTimeout(timer);
        if (!response.ok) return;
        const xml = await response.text();
        collected.push(...parseRssItems(xml, feed.source));
      } catch {
        // Network/RSS failures fall through to seed content.
      }
    }),
  );

  if (collected.length === 0) {
    return SEED_ARTICLES;
  }

  const keyword =
    /(aging|ageing|longevity|sleep|metabol|mitochondr|exercise|muscle|inflam|cardio|neuro)/i;

  const filtered = collected.filter(
    (article) => keyword.test(article.title) || keyword.test(article.excerpt),
  );

  return (filtered.length ? filtered : collected).slice(0, 10);
}
