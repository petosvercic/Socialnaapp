import type { AnswerMap, CheckinResult, MoodCategory } from "@/lib/mood/types";

export type StoredCheckin = {
  id: string;
  dayId: string;
  dateISO: string; // yyyy-mm-dd (local)
  createdAt: string; // ISO timestamp
  result: CheckinResult;
  answers: AnswerMap;
};

const KEY = "viora.checkins.v1";

function safeParse(json: string | null): StoredCheckin[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data)) return [];
    // Best-effort validation. We keep it lenient for MVP.
    return data as StoredCheckin[];
  } catch {
    return [];
  }
}

function readAll(): StoredCheckin[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

function writeAll(items: StoredCheckin[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

/**
 * Returns yyyy-mm-dd based on the user's local timezone.
 */
export function localDateISO(d: Date = new Date()): string {
  const local = new Date(d);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

export function loadCheckins(): StoredCheckin[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveCheckin(entry: StoredCheckin) {
  const all = readAll();

  // Upsert: one entry per date+category (keeps history clean).
  const idx = all.findIndex(
    (x) => x.dateISO === entry.dateISO && x.result?.category === entry.result?.category
  );

  if (idx >= 0) all[idx] = entry;
  else all.push(entry);

  writeAll(all);
}

export function deleteCheckin(id: string) {
  const all = readAll().filter((x) => x.id !== id);
  writeAll(all);
}

export function clearCheckins() {
  writeAll([]);
}

export function getLatestCheckin(category: MoodCategory = "general"): StoredCheckin | null {
  const all = loadCheckins().filter((x) => x.result?.category === category);
  return all.length ? all[0] : null;
}
