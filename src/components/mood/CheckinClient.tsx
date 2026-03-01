"use client";

import { useMemo, useState } from "react";
import type { AnswerMap, AnswerValue, Question } from "@/lib/mood/types";
import { sampleDay } from "@/lib/mood/sample-day";
import { scoreCheckin } from "@/lib/mood/scoring";

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium">{children}</div>;
}

function Help({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-zinc-600 dark:text-zinc-300">{children}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

function QuestionField({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  switch (q.kind) {
    case "single_choice":
      return (
        <div className="mt-3 space-y-2">
          {q.options.map((opt) => {
            const checked = String(value ?? "") === opt.id;
            return (
              <label
                key={opt.id}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm",
                  checked
                    ? "border-zinc-900 dark:border-zinc-200"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={opt.id}
                  checked={checked}
                  onChange={() => onChange(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      );

    case "binary": {
      const bool = typeof value === "boolean" ? value : undefined;
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={[
              "rounded-xl border px-3 py-2 text-sm",
              bool === true
                ? "border-zinc-900 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {q.yesLabel ?? "Áno"}
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={[
              "rounded-xl border px-3 py-2 text-sm",
              bool === false
                ? "border-zinc-900 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {q.noLabel ?? "Nie"}
          </button>
        </div>
      );
    }

    case "slider": {
      const num = typeof value === "number" ? value : Math.round((q.min + q.max) / 2);
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
            <span>{q.minLabel ?? q.min}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{num}</span>
            <span>{q.maxLabel ?? q.max}</span>
          </div>
          <input
            type="range"
            min={q.min}
            max={q.max}
            step={q.step ?? 1}
            value={num}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      );
    }

    case "percent": {
      const num = typeof value === "number" ? value : 50;
      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
            <span>{q.minLabel ?? "0%"}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{num}%</span>
            <span>{q.maxLabel ?? "100%"}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={num}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      );
    }

    case "text":
      return (
        <div className="mt-3">
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={q.placeholder ?? ""}
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>
      );
  }
}

export function CheckinClient() {
  const day = sampleDay;

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);

  const missing = useMemo(() => {
    // Require all non-text questions.
    const required = day.questions.filter((q) => q.kind !== "text");
    return required.filter((q) => answers[q.id] === undefined).map((q) => q.id);
  }, [answers, day.questions]);

  const result = useMemo(() => {
    if (!submitted) return null;
    return scoreCheckin(day, "general", answers);
  }, [submitted, day, answers]);

  return (
    <div className="space-y-4">
      {!result ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-4"
        >
          {day.questions.map((q) => (
            <Card key={q.id}>
              <Label>{q.prompt}</Label>
              <QuestionField
                q={q}
                value={answers[q.id]}
                onChange={(v) => {
                  setSubmitted(false);
                  setAnswers((prev) => ({ ...prev, [q.id]: v }));
                }}
              />
              {missing.includes(q.id) ? (
                <div className="mt-2 text-xs text-red-600">Toto ešte vyplň.</div>
              ) : null}
            </Card>
          ))}

          <button
            type="submit"
            disabled={missing.length > 0}
            className={[
              "w-full rounded-xl px-4 py-3 text-sm font-medium",
              missing.length > 0
                ? "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
            ].join(" ")}
          >
            Vyhodnoť môj deň
          </button>

          <Help>
            Pozn.: Toto je MVP demo. Neskôr sem pôjde „daily content“ z adminu a výsledok sa uloží do histórie.
          </Help>
        </form>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">Výsledok</div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  {result.status} ({result.score}/100)
                </div>
              </div>
              <div className="text-4xl" aria-hidden>
                {result.icon}
              </div>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div>{result.meaning}</div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Tip</div>
                <div className="mt-1">{result.tip}</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Upraviť odpovede
            </button>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
