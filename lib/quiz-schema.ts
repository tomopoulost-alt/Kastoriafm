import { z } from "zod";

export const quizAnswersSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  age: z.number().int().min(18).max(100),
  goal: z.enum(["energy", "recovery", "focus", "metabolic", "longevity"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "high", "elite"]),
  sleepQuality: z.enum(["poor", "fair", "good", "excellent"]),
  stressLevel: z.enum(["low", "moderate", "high", "chronic"]),
  supplements: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
});

export type QuizAnswersInput = z.infer<typeof quizAnswersSchema>;
