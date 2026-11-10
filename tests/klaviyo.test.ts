import assert from "node:assert/strict";
import { test } from "node:test";
import { sendQuizCompletionEvent } from "../lib/klaviyo";

test("sendQuizCompletionEvent skips when API key is missing", async () => {
  delete process.env.KLAVIYO_PRIVATE_API_KEY;
  const result = await sendQuizCompletionEvent({
    answers: {
      email: "sam@example.com",
      firstName: "Sam",
      age: 38,
      goal: "energy",
      activityLevel: "light",
      sleepQuality: "fair",
      stressLevel: "low",
      supplements: [],
    },
    protocol: {
      headline: "Test",
      summary: "Summary",
      focusAreas: ["energy"],
      morning: { title: "Morning", items: ["light"] },
      midday: { title: "Midday", items: ["walk"] },
      evening: { title: "Evening", items: ["sleep"] },
      weekly: { title: "Weekly", items: ["review"] },
      cautions: ["educational"],
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.skipped, true);
});
