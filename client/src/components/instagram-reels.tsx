import { useState } from "react";
import { Play } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_PROFILE_URL,
  reelEmbedUrl,
  reelUrl,
  type InstagramReel,
} from "@/lib/instagram-reels";

/**
 * The studio's Instagram reels, presented to match the site.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY CARDS AND A PLAYER, NOT INLINE EMBEDS. Instagram's embed is a white card with a
 * profile header, like counts and a comment box. Several of them dropped into a dark page
 * looked pasted-in, and each one loads Instagram's scripts whether or not anyone watches.
 *
 * So each reel is a dark card carrying the caption's own opening line — no network cost —
 * and the official embed loads only when someone chooses to watch, in a dialog. The embed
 * itself is shown unmodified (header and "View more on Instagram" intact).
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

const formatPosted = (iso: string) =>
  new Date(`${iso}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function ReelCard({ reel, onOpen }: { reel: InstagramReel; onOpen: (reel: InstagramReel) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(reel)}
      aria-label={`Watch reel: ${reel.topic}`}
      className="group relative flex min-h-[220px] w-full min-w-0 flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-950 to-black p-5 text-left transition-colors hover:border-green-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
      data-testid={`reel-card-${reel.id}`}
    >
      {/* Soft brand glow, so the card reads as media rather than a text box. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-500/10 blur-3xl transition-opacity group-hover:opacity-80"
      />
      <span className="relative flex items-center gap-2 text-xs font-medium text-gray-300">
        <SiInstagram className="h-4 w-4" aria-hidden="true" />@{INSTAGRAM_HANDLE}
      </span>
      <span className="relative text-lg font-semibold leading-snug text-white sm:text-xl">“{reel.headline}”</span>
      <span className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-black transition-transform group-hover:scale-105">
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          Watch reel
        </span>
        <span className="text-xs text-gray-400">{formatPosted(reel.posted)}</span>
      </span>
    </button>
  );
}

/**
 * A section of reels with the player dialog. Renders nothing when given no reels, so a page
 * without a relevant reel shows nothing rather than an unrelated one.
 */
export default function InstagramReels({
  reels,
  heading = "Our work on Instagram",
  intro,
  className = "",
  headingLevel = "h2",
  variant = "section",
}: {
  reels: InstagramReel[];
  heading?: string;
  intro?: string;
  className?: string;
  headingLevel?: "h2" | "h3";
  /** "section": full-width page band. "inline": sits inside article text (blog). */
  variant?: "section" | "inline";
}) {
  const [active, setActive] = useState<InstagramReel | null>(null);
  const unique = Array.from(new Map(reels.map((r) => [r.id, r])).values());
  if (unique.length === 0) return null;

  const Heading = headingLevel;
  // Centred in a page band; left-aligned with the text inside an article.
  const centre = variant === "section" ? "mx-auto " : "";
  // `!grid`/`!gap-4`/`!grid-cols-*` (Tailwind's important-modifier syntax), not the plain
  // utility names: `.p91x .grid` (redesign.css, the card grids elsewhere on this page) sets
  // its OWN grid-template-columns/gap and — being a two-class selector — outranks Tailwind's
  // bare one-class `.grid`/`.gap-4`/`.sm\:grid-cols-2` regardless of source order. That left
  // a 1- or 2-reel section rendering inside a leftover 3-column track from that rule, with
  // 2 empty grid cells of dead space next to the one real card.
  const grid =
    unique.length === 1
      ? `${centre}!grid max-w-xs !gap-4`
      : unique.length === 2
        ? `${centre}!grid max-w-2xl !gap-4 sm:!grid-cols-2`
        : "!grid !gap-4 sm:!grid-cols-2 lg:!grid-cols-4";

  const body = (
    <>
      <div className={variant === "section" ? "mb-8 text-center" : "mb-5"}>
        <Heading className={variant === "section" ? "text-2xl font-bold text-white sm:text-3xl lg:text-4xl" : "text-xl font-bold text-white sm:text-2xl"}>
          {heading}
        </Heading>
        {intro && <p className={variant === "section" ? "mx-auto mt-3 max-w-xl text-gray-300" : ""}>{intro}</p>}
      </div>
      <div className={grid}>
        {unique.map((reel) => (
          <ReelCard key={reel.id} reel={reel} onOpen={setActive} />
        ))}
      </div>
      <p className={variant === "section" ? "mt-6 text-center" : "mt-4"}>
        <a
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300"
          data-testid="link-instagram-profile"
        >
          <SiInstagram className="h-4 w-4" aria-hidden="true" />
          Follow @{INSTAGRAM_HANDLE} for more
        </a>
      </p>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent
          className="w-[calc(100vw-1.5rem)] max-w-[420px] overflow-hidden rounded-2xl border-0 bg-black p-0"
          data-testid="reel-player"
        >
          <DialogTitle className="sr-only">{active?.topic ?? "Instagram reel"}</DialogTitle>
          <DialogDescription className="sr-only">
            A reel from @{INSTAGRAM_HANDLE} on Instagram.
          </DialogDescription>
          {active && (
            <>
              <iframe
                key={active.id}
                src={reelEmbedUrl(active)}
                title={`Instagram reel: ${active.topic}`}
                className="block h-[min(760px,80vh)] w-full border-0 bg-white"
                allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
                allowFullScreen
                data-testid="reel-embed"
              />
              <a
                href={reelUrl(active)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center justify-center gap-2 bg-gray-950 text-sm text-gray-300 hover:text-white"
              >
                <SiInstagram className="h-4 w-4" aria-hidden="true" />
                Open on Instagram
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  return variant === "section" ? (
    <section className={`px-4 py-16 ${className}`} data-testid="instagram-reels">
      <div className="mx-auto max-w-5xl">{body}</div>
    </section>
  ) : (
    <aside className={className} data-testid="instagram-reels">
      {body}
    </aside>
  );
}
