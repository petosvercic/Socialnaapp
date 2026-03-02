export type Visibility = "public" | "public" | "friends" | "hidden";
export type FeedDetail = "color" | "icon" | "text";

export type Prefs = {
  visibility: Visibility;
  detail: FeedDetail;
  /** If true, user is effectively hidden for today (soft hide). */
  invisibleToday: boolean;
  updatedAt: string; // ISO
};

export const defaultPrefs: Prefs = {
  visibility: "friends",
  detail: "icon",
  invisibleToday: false,
  updatedAt: new Date(0).toISOString(),
};
