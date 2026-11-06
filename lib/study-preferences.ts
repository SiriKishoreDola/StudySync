export const settingsStorageKey = "studysync-demo-settings-v1";
export const defaults = { zone: "America/Los_Angeles", format: "12-hour", week: "Sunday", study: "Morning · 9 AM–12 PM", length: "45 minutes" };
export type Preferences = typeof defaults;
export const choices: Record<keyof Preferences, string[]> = {
  zone: ["America/Los_Angeles", "America/Chicago", "America/New_York", "Europe/London", "Asia/Kolkata", "UTC"],
  format: ["12-hour", "24-hour"], week: ["Sunday", "Monday"],
  study: ["Morning · 9 AM–12 PM", "Afternoon · 12–5 PM", "Evening · 5–9 PM"],
  length: ["25 minutes", "45 minutes", "60 minutes", "90 minutes"],
};

/** Allowlist remaining fields so legacy preferences retain their supported values. */
export function parsePreferences(raw: string | null): Preferences {
  const parsed: unknown = JSON.parse(raw || "null");
  const valid = { ...defaults };
  if (!parsed || typeof parsed !== "object") return valid;
  for (const key of Object.keys(defaults) as (keyof Preferences)[]) {
    const value = (parsed as Record<string, unknown>)[key];
    if (typeof value === "string" && choices[key].includes(value)) valid[key] = value;
  }
  return valid;
}
