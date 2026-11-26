import Link from "next/link";
import { GUIDES, GUIDES_HUB as H } from "@p91/content/site/guides";
import { GUIDE_SOURCES } from "@p91/content/site/guides-data";
import { metadataFor } from "@web/lib/metadata";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { CtaBand } from "@web/components/cta-band";

const PATH = "/guides";
export const metadata = metadataFor(PATH);

/** /guides: every guide as a card, newest first. Excerpts come from the source posts, or GUIDES_HUB for the new guides. */
export default function GuidesHub() {
  const cards = [...GUIDES].sort((a, b) => (b.updated ?? b.date).localeCompare(a.updated ?? a.date));
  return (
    <main>
      <section aria-labelledby="guides-h1" className="pb-10 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: PATH }]} />
          <h1 id="guides-h1" className="m-0 text-[clamp(36px,4.6vw,60px)] font-extrabold">{H.h1}</h1>
          <p className="mb-0 mt-4 max-w-[720px] text-xl text-text-2">{H.lede}</p>
          {H.intro.map((p) => <p key={p} className="mb-0 mt-3 max-w-[720px] text-text-2">{p}</p>)}
        </div>
      </section>

      <Section labelledBy="list-h2" tone="ground">
        <h2 id="list-h2" className="mb-7 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">All guides</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {cards.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-white text-ink no-underline hover:border-action">
              {g.image && <div className="h-[200px]"><Photo src={g.image.src} alt={g.image.alt} width={g.image.width} height={g.image.height} /></div>}
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <h3 className="m-0 text-[21px] font-bold">{g.h1}</h3>
                <p className="m-0 text-[15px] text-text-2">{H.excerpts[g.slug] ?? GUIDE_SOURCES[g.slug]?.excerpt}</p>
                <p className="m-0 mt-auto pt-2 text-sm text-muted">{g.readMinutes} min read</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <div className="pt-16" />
      <CtaBand title="A question the guides do not answer?" body="Send a photo of your car on WhatsApp and we will tell you what it needs." primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
    </main>
  );
}
