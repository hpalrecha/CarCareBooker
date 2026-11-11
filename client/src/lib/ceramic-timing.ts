/**
 * Confirmed studio time for the two 1-Year Ceramic Coating records, and the one place that applies it.
 *
 * The catalogue rows (database) still carry an FAQ answer giving the old six-to-eight-hour figure. The studio confirmed
 * (2026-11-11) car = approx. 36-48+ hours, bike = approx. 36-48 hours. This module replaces that one answer, and sets the
 * time text, for these two slugs only, on every surface that reads the catalogue: the page, the server-rendered HTML and
 * the FAQPage JSON-LD. Car and bike are kept separate.
 *
 * It replaces an existing "How long does the application process take?" answer. It never adds a question the row lacks.
 * When the database rows are corrected (scripts/2026-11-11-ceramic-duration-faq.mjs) this becomes a no-op.
 *
 * Relative imports only: server/vite.ts is bundled by esbuild and imports this directly.
 */
export const CERAMIC_TIMING_QUESTION = "How long does the application process take?";

export const CERAMIC_TIMING: Record<string, { answer: string; timeText: string }> = {
  "1-year-ceramic-coating": {
    answer: "Approx. 36–48+ hours in the studio, depending on the preparation required.",
    timeText: "36-48+ hrs",
  },
  "1-year-bike-ceramic-coating": {
    answer: "Approx. 36–48 hours in the studio.",
    timeText: "36-48 hrs",
  },
};

interface TimedService {
  slug?: string | null;
  durationText?: string | null;
  faq?: Array<{ question?: string | null; answer?: string | null }> | null;
}

/** The record with the confirmed time applied; the same object when its slug is not a ceramic record. */
export function withCeramicTiming<T extends TimedService>(service: T): T;
export function withCeramicTiming<T extends TimedService>(service: T | undefined | null): T | undefined | null;
export function withCeramicTiming<T extends TimedService>(service: T | undefined | null): T | undefined | null {
  const timing = service?.slug ? CERAMIC_TIMING[service.slug] : undefined;
  if (!service || !timing) return service;
  const faq = Array.isArray(service.faq)
    ? service.faq.map((f) =>
        String(f?.question ?? "").trim().toLowerCase() === CERAMIC_TIMING_QUESTION.toLowerCase()
          ? { ...f, answer: timing.answer }
          : f,
      )
    : service.faq;
  return { ...service, faq, durationText: timing.timeText };
}
