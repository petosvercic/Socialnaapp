export type MoodCategory = "general" | "finances" | "relationships" | "social" | "health";

export type QuestionKind = "single_choice" | "binary" | "slider" | "percent" | "text";

export type QuestionBase = {
  id: string;
  prompt: string;
  category: MoodCategory;
  kind: QuestionKind;
  weight?: number; // optional multiplier (0..1+)
};

export type SingleChoiceQuestion = QuestionBase & {
  kind: "single_choice";
  options: { id: string; label: string; score: number }[]; // 0..100
};

export type BinaryQuestion = QuestionBase & {
  kind: "binary";
  yesLabel?: string;
  noLabel?: string;
  yesScore: number;
  noScore: number;
};

export type SliderQuestion = QuestionBase & {
  kind: "slider";
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
};

export type PercentQuestion = QuestionBase & {
  kind: "percent";
  minLabel?: string;
  maxLabel?: string;
};

export type TextQuestion = QuestionBase & {
  kind: "text";
  placeholder?: string;
};

export type Question =
  | SingleChoiceQuestion
  | BinaryQuestion
  | SliderQuestion
  | PercentQuestion
  | TextQuestion;

export type DayDefinition = {
  id: string;
  dateISO: string; // yyyy-mm-dd
  title: string;
  questions: Question[];
};

export type AnswerValue = string | number | boolean;
export type AnswerMap = Record<string, AnswerValue>;

export type MoodColor = "green" | "yellow" | "orange" | "red";

export type CheckinResult = {
  category: MoodCategory;
  score: number; // 0..100
  color: MoodColor;
  icon: string;
  status: string;
  meaning: string;
  tip: string;
};
