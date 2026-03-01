import type { DayDefinition } from "@/lib/mood/types";

// MVP placeholder content.
// Later: this will be admin-configured and fetched from DB.
export const sampleDay: DayDefinition = {
  id: "sample-2026-03-01",
  dateISO: "2026-03-01",
  title: "Denný check-in (general)",
  questions: [
    {
      id: "q_energy",
      category: "general",
      kind: "slider",
      prompt: "Koľko energie máš dnes v tele?",
      min: 0,
      max: 10,
      step: 1,
      minLabel: "0 (mŕtvy režim)",
      maxLabel: "10 (raketa)",
      weight: 1,
    },
    {
      id: "q_focus",
      category: "general",
      kind: "percent",
      prompt: "Koľko % hlavy je dnes schopných sústrediť sa?",
      minLabel: "0% (chaos)",
      maxLabel: "100% (laser)",
      weight: 1,
    },
    {
      id: "q_social",
      category: "general",
      kind: "single_choice",
      prompt: "Čo je pre teba dnes sociálne najviac pravdivé?",
      options: [
        { id: "solo", label: "Nechaj ma na pokoji", score: 20 },
        { id: "small", label: "Dám smalltalk, nič hlboké", score: 55 },
        { id: "ok", label: "Som celkom v pohode", score: 75 },
        { id: "letsgo", label: "Môžem ľudí, bring it on", score: 90 },
      ],
      weight: 1,
    },
    {
      id: "q_decisions",
      category: "general",
      kind: "binary",
      prompt: "Máš dnes chuť robiť väčšie rozhodnutia?",
      yesLabel: "Áno",
      noLabel: "Nie",
      yesScore: 75,
      noScore: 35,
      weight: 0.9,
    },
    {
      id: "q_note",
      category: "general",
      kind: "text",
      prompt: "Jedna veta pre kontext (voliteľné)",
      placeholder: "Čo ti dnes najviac sedí v hlave?",
      weight: 0,
    },
  ],
};
