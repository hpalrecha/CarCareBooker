import { VERIFIED_REVIEWS, GOOGLE_REVIEWS_URL } from "@p91/content/reviews";

/**
 * Quotes named Google reviews word for word, with the reviewer's name. No star rating, no count,
 * no Review/AggregateRating markup (owner decision, 26 Nov 2026). Throws at build time if a name
 * is not in VERIFIED_REVIEWS, so a typo cannot ship an invented quote.
 */
export function ReviewQuotes({ names, labelledBy, title = "What owners wrote on Google" }: { names: string[]; labelledBy: string; title?: string }) {
  const reviews = names.map((n) => {
    const r = VERIFIED_REVIEWS.find((v) => v.name === n);
    if (!r) throw new Error(`ReviewQuotes: no verified review by "${n}"`);
    return r;
  });
  return (
    <>
      <h2 id={labelledBy} className="mb-7 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {reviews.map((r) => (
          <figure key={r.name} className="m-0 flex flex-col gap-3 rounded-[14px] border border-line bg-white p-6">
            <blockquote className="m-0 text-[15px] text-text-2">{r.text}</blockquote>
            <figcaption className="mt-auto text-sm"><strong className="text-ink">{r.name}</strong> · Google review</figcaption>
          </figure>
        ))}
      </div>
      <p className="mb-0 mt-6"><a href={GOOGLE_REVIEWS_URL} className="font-bold">Read all our Google reviews</a></p>
    </>
  );
}
