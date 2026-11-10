import assert from "node:assert/strict";
import { test } from "node:test";
import { quizAnswersSchema } from "../lib/quiz-schema";

test("accepts a valid quiz payload", () => {
  const parsed = quizAnswersSchema.parse({
    email: "alex@example.com",
    firstName: "Alex",
    age: 41,
    goal: "recovery",
    activityLevel: "high",
    sleepQuality: "fair",
    stressLevel: "moderate",
    supplements: ["Creatine", "Magnesium"],
  });

  assert.equal(parsed.firstName, "Alex");
  assert.equal(parsed.goal, "recovery");
});

test("rejects invalid email and age", () => {
  const result = quizAnswersSchema.safeParse({
    email: "not-an-email",
    firstName: "Alex",
    age: 12,
    goal: "energy",
    activityLevel: "light",
    sleepQuality: "good",
    stressLevel: "low",
    supplements: [],
  });

  assert.equal(result.success, false);
});
