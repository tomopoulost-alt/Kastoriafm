import assert from "node:assert/strict";
import { test } from "node:test";
import { generateProtocol, summarizeNews } from "../lib/llm";

test("generateProtocol returns a local fallback without OPENAI_API_KEY", async () => {
  delete process.env.OPENAI_API_KEY;
  const protocol = await generateProtocol({
    email: "sam@example.com",
    firstName: "Sam",
    age: 38,
    goal: "focus",
    activityLevel: "moderate",
    sleepQuality: "good",
    stressLevel: "high",
    supplements: ["Omega-3"],
  });

  assert.match(protocol.headline, /Sam/);
  assert.ok(protocol.morning.items.length >= 3);
  assert.ok(protocol.cautions.length >= 1);
});

test("summarizeNews returns carousel slides from seed articles", async () => {
  delete process.env.OPENAI_API_KEY;
  const brief = await summarizeNews([
    {
      title: "Sleep regularity matters",
      url: "https://example.com/a",
      source: "Test",
      excerpt: "Consistent midpoints track with healthier markers.",
    },
  ]);

  assert.ok(brief.carouselSlides.length >= 3);
  assert.ok(brief.headline.length > 0);
});
