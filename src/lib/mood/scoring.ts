import type { AnswerMap, CheckinResult, DayDefinition, MoodCategory, MoodColor, Question } from "@/lib/mood/types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function colorForScore(score: number): MoodColor {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  if (score >= 25) return "orange";
  return "red";
}

function iconForColor(color: MoodColor) {
  switch (color) {
    case "green":
      return "🟢";
    case "yellow":
      return "🟡";
    case "orange":
      return "🟠";
    case "red":
      return "🔴";
  }
}

function copyFor(color: MoodColor) {
  // Non-diagnostic, practical wording (we're not therapists).
  switch (color) {
    case "green":
      return {
        status: "Stabilný mód",
        meaning: "Dnes to vyzerá, že máš celkom slušnú kontrolu nad vecami.",
        tip: "Naplánuj si jednu malú výhru a dokonči ju.",
      };
    case "yellow":
      return {
        status: "Kolísavý mód",
        meaning: "Nie je to zlé. Len to môže lietať medzi „idem“ a „nechaj ma“.",
        tip: "Drž sa menších rozhodnutí a nepchaj sa do drámy.",
      };
    case "orange":
      return {
        status: "Napätý mód",
        meaning: "Niečo ťa tlačí. Nerieš dnes veľké témy, ak nemusíš.",
        tip: "Urob si jednu pauzu bez mobilu. Fakt jednu.",
      };
    case "red":
      return {
        status: "Preťažený mód",
        meaning: "Dnes to chce menej hluku a viac priestoru pre seba.",
        tip: "Odlož veľké rozhodnutia. Daj telu základ: voda, jedlo, spánok.",
      };
  }
}

function scoreFromQuestion(q: Question, value: unknown): number | null {
  if (value === undefined || value === null) return null;

  switch (q.kind) {
    case "single_choice": {
      const v = String(value);
      const opt = q.options.find((o) => o.id === v);
      return opt ? opt.score : null;
    }
    case "binary": {
      const v = Boolean(value);
      return v ? q.yesScore : q.noScore;
    }
    case "slider": {
      const v = Number(value);
      const n = clamp(v, q.min, q.max);
      const pct = (n - q.min) / (q.max - q.min || 1);
      return Math.round(pct * 100);
    }
    case "percent": {
      const v = Number(value);
      return clamp(v, 0, 100);
    }
    case "text": {
      // Text does not affect score (context only).
      return null;
    }
  }
}

export function scoreCheckin(day: DayDefinition, category: MoodCategory, answers: AnswerMap): CheckinResult {
  const relevant = day.questions.filter((q) => q.category === category);

  let total = 0;
  let weightSum = 0;

  for (const q of relevant) {
    const raw = scoreFromQuestion(q, answers[q.id]);
    if (raw === null) continue;

    const w = q.weight ?? 1;
    total += raw * w;
    weightSum += w;
  }

  const score = weightSum > 0 ? Math.round(total / weightSum) : 50;
  const color = colorForScore(score);
  const icon = iconForColor(color);
  const copy = copyFor(color);

  return {
    category,
    score,
    color,
    icon,
    status: copy.status,
    meaning: copy.meaning,
    tip: copy.tip,
  };
}
