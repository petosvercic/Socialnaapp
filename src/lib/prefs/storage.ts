import { defaultPrefs, type Prefs } from "./types";

const KEY = "viora:prefs:v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadPrefs(): Prefs {
  if (!isBrowser()) return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<Prefs> | null;
    if (!parsed || typeof parsed !== "object") return defaultPrefs;

    const merged: Prefs = {
      ...defaultPrefs,
      ...parsed,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : defaultPrefs.updatedAt,
    };

    // sanity guards
    if (!["public", "friends", "hidden"].includes(merged.visibility)) merged.visibility = defaultPrefs.visibility;
    if (!["color", "icon", "text"].includes(merged.detail)) merged.detail = defaultPrefs.detail;
    merged.invisibleToday = Boolean(merged.invisibleToday);

    return merged;
  } catch {
    return defaultPrefs;
  }
}

export function updatePrefs(patch: Partial<Omit<Prefs, "updatedAt">>): Prefs {
  const next: Prefs = {
    ...loadPrefs(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota / privacy mode
    }
  }
  return next;
}

export function resetPrefs(): Prefs {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
  }
  return defaultPrefs;
}
