import type { PersonalizedProtocol, QuizAnswers } from "./types";

export interface KlaviyoEventResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  status?: number;
}

/**
 * Sends a quiz completion event to Klaviyo via the Events API.
 * Gracefully no-ops when KLAVIYO_PRIVATE_API_KEY is unset (local/dev).
 */
export async function sendQuizCompletionEvent(input: {
  answers: QuizAnswers;
  protocol: PersonalizedProtocol;
}): Promise<KlaviyoEventResult> {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey) {
    return {
      ok: true,
      skipped: true,
      reason: "KLAVIYO_PRIVATE_API_KEY not configured",
    };
  }

  const payload = {
    data: {
      type: "event",
      attributes: {
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: "Longevity Quiz Completed",
            },
          },
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: input.answers.email,
              first_name: input.answers.firstName,
              properties: {
                longevity_goal: input.answers.goal,
                activity_level: input.answers.activityLevel,
                sleep_quality: input.answers.sleepQuality,
                stress_level: input.answers.stressLevel,
                supplements: input.answers.supplements,
              },
            },
          },
        },
        properties: {
          protocol_headline: input.protocol.headline,
          protocol_summary: input.protocol.summary,
          focus_areas: input.protocol.focusAreas,
          list_id: listId ?? null,
        },
        time: new Date().toISOString(),
      },
    },
  };

  const response = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      revision: "2024-10-15",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      ok: false,
      status: response.status,
      reason: detail.slice(0, 500),
    };
  }

  return { ok: true, status: response.status };
}

/**
 * Optional webhook bridge for Zapier / Make / custom listeners.
 */
export async function postKlaviyoWebhook(body: unknown): Promise<KlaviyoEventResult> {
  const webhookUrl = process.env.KLAVIYO_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      ok: true,
      skipped: true,
      reason: "KLAVIYO_WEBHOOK_URL not configured",
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    ok: response.ok,
    status: response.status,
    reason: response.ok ? undefined : await response.text(),
  };
}
