import { NextResponse } from "next/server";
import { summarizeNews } from "@/lib/llm";
import { scrapeLongevityNews } from "@/lib/news";
import type { NewsBrief } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await scrapeLongevityNews();
    const summarized = await summarizeNews(articles);

    const brief: NewsBrief = {
      ...summarized,
      sourceArticles: articles,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate news brief", detail: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      forceSeed?: boolean;
    };

    const articles = body.forceSeed
      ? await scrapeLongevityNews()
      : await scrapeLongevityNews();
    const summarized = await summarizeNews(articles);

    const brief: NewsBrief = {
      ...summarized,
      sourceArticles: articles,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate news brief", detail: message },
      { status: 500 },
    );
  }
}
