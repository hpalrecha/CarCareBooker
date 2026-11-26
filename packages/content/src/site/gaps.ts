/**
 * Content gaps: a fact the studio has not supplied yet is written in the copy as "[NEEDS: ...]".
 *
 * Owner decision 26 Nov 2026 (indexing priority): a gap must never block a page and must never be shown.
 * The templates pass every content string through these helpers, so the content keeps its markers (and
 * `npm run web:ship-gate` keeps listing them for the studio) while the page renders without them:
 * - prose (a paragraph, a short answer, an intro): the sentence carrying the marker is dropped;
 * - a list item, FAQ, fact row, step or caption carrying a marker is dropped whole;
 * - a section left with nothing in it is dropped by the template.
 * `scripts/web/check-pages.mjs` fails the build check if "[NEEDS" or "NEEDS:" still reaches visible HTML.
 *
 * Type-only imports: the web templates and the plain-Node tests both use it.
 */
import type { GuideBlock } from "./types.ts";

const GAP = /\[NEEDS\b|NEEDS:/;
const MARKER = /\[NEEDS[^\]]*\]/g;

/** True when a string (or any string inside an object) still carries a gap marker. */
export function hasGap(value: unknown): boolean {
  if (value == null) return false;
  return GAP.test(typeof value === "string" ? value : JSON.stringify(value));
}

/**
 * Prose without its gaps: every sentence that carries a marker is dropped. Returns "" when nothing is left.
 * Markers are masked before the split, so a full stop inside one ("[NEEDS: approx. drive time]") cannot cut it in two.
 */
export function withoutGaps(text: string): string {
  if (!hasGap(text)) return text;
  const masked = text.replace(MARKER, "\u0001");
  return masked
    .split(/(?<=[.!?\]\u0001])\s+/) // a masked marker ends a sentence, as its closing "]" did
    .filter((s) => !s.includes("\u0001") && !hasGap(s))
    .join(" ")
    .trim();
}

/** Prose list (paragraphs): each item without its gap sentences, empty items dropped. */
export function proseWithoutGaps(items: readonly string[] | undefined): string[] {
  return (items ?? []).map(withoutGaps).filter((p) => p !== "");
}

/** Items (list entries, FAQs, fact rows, steps, captioned photos) with every item that carries a gap dropped whole. */
export function gapFree<T>(items: readonly T[] | undefined): T[] {
  return (items ?? []).filter((i) => !hasGap(i));
}

/**
 * Guide blocks without their gaps: prose loses the sentence; lists, table rows and FAQs lose the item; a heading left
 * with nothing under it (before the next heading of the same or a higher level, or the end) is dropped.
 */
export function guideBlocksWithoutGaps(blocks: readonly GuideBlock[]): GuideBlock[] {
  let out: GuideBlock[] = [];
  for (const b of blocks) {
    switch (b.t) {
      case "h2":
      case "h3":
        if (!hasGap(b.text)) out.push(b);
        break;
      case "p": {
        const text = withoutGaps(b.text);
        if (text) out.push({ ...b, text });
        break;
      }
      case "ul":
      case "ol": {
        const items = gapFree(b.items);
        if (items.length) out.push({ ...b, items });
        break;
      }
      case "table": {
        const rows = gapFree(b.rows);
        if (rows.length) out.push({ ...b, rows });
        break;
      }
      case "faq": {
        const items = gapFree(b.items);
        if (items.length) out.push({ ...b, items });
        break;
      }
    }
  }
  const rank = (b: GuideBlock) => (b.t === "h2" ? 2 : b.t === "h3" ? 3 : 9);
  // Repeat until stable, so an h2 whose only h3 was emptied goes too.
  for (let changed = true; changed;) {
    const next = out.filter((b, i) => rank(b) === 9 || (out[i + 1] !== undefined && rank(out[i + 1]) > rank(b)));
    changed = next.length !== out.length;
    out = next;
  }
  return out;
}
