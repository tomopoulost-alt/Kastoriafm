export type LongevityGoal =
  | "energy"
  | "recovery"
  | "focus"
  | "metabolic"
  | "longevity";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "elite";

export type SleepQuality = "poor" | "fair" | "good" | "excellent";

export type StressLevel = "low" | "moderate" | "high" | "chronic";

export interface QuizAnswers {
  email: string;
  firstName: string;
  age: number;
  goal: LongevityGoal;
  activityLevel: ActivityLevel;
  sleepQuality: SleepQuality;
  stressLevel: StressLevel;
  supplements: string[];
  notes?: string;
}

export interface ProtocolBlock {
  title: string;
  items: string[];
}

export interface PersonalizedProtocol {
  headline: string;
  summary: string;
  focusAreas: string[];
  morning: ProtocolBlock;
  midday: ProtocolBlock;
  evening: ProtocolBlock;
  weekly: ProtocolBlock;
  cautions: string[];
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  excerpt: string;
}

export interface NewsBrief {
  headline: string;
  summary: string;
  keyTakeaways: string[];
  carouselSlides: CarouselSlide[];
  sourceArticles: NewsArticle[];
  generatedAt: string;
}

export interface CarouselSlide {
  eyebrow: string;
  title: string;
  body: string;
  footer?: string;
}
