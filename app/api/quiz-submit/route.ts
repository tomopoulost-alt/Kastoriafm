import { NextResponse } from "next/server";
import { postKlaviyoWebhook, sendQuizCompletionEvent } from "@/lib/klaviyo";
import { generateProtocol } from "@/lib/llm";
import { quizAnswersSchema } from "@/lib/quiz-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = quizAnswersSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quiz payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const answers = parsed.data;
    const protocol = await generateProtocol(answers);

    const [klaviyo, webhook] = await Promise.all([
      sendQuizCompletionEvent({ answers, protocol }),
      postKlaviyoWebhook({
        type: "longevity_quiz_completed",
        answers,
        protocol,
        at: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({
      ok: true,
      protocol,
      delivery: { klaviyo, webhook },
      pdfUrl: `/templates/pdf-protocol?name=${encodeURIComponent(answers.firstName)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Quiz submission failed", detail: message },
      { status: 500 },
    );
  }
}
