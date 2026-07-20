/**
 * First-touch UTM capture: params found on any landing URL are stored for 30
 * days and merged into every dataLayer push, so conversions stay attributed
 * to the campaign that brought the visitor in.
 */

const UTM_STORAGE_KEY = "utm_params";
const UTM_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

type UtmData = Record<string, string> & { captured_at: string };

export function captureUtmParams(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const values: Record<string, string> = {};
  for (const key of UTM_PARAMS) {
    const value = params.get(key);
    if (value) values[key] = value;
  }
  if (Object.keys(values).length === 0) return;

  values.captured_at = new Date().toISOString();
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Private browsing / quota — attribution is best-effort.
  }
}

export function getUtmParams(): UtmData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as UtmData;
    if (Date.now() - new Date(data.captured_at).getTime() > UTM_MAX_AGE_MS) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
