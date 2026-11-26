import Link from "next/link";
import { GALLERY as G } from "@p91/content/site/gallery";
import { metadataFor } from "@web/lib/metadata";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { CtaBand } from "@web/components/cta-band";

const PATH = "/gallery";
export const metadata = metadataFor(PATH, "/photos/creta-stek-ppf-studio.webp");

/** /gallery: verified P91 photos only (photo catalogue), grouped, each captioned with what it shows. */
export default function GalleryPage() {
  return (
    <main>
      <section aria-labelledby="gallery-h1" className="pb-10 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Gallery", path: PATH }]} />
          <h1 id="gallery-h1" className="m-0 text-[clamp(36px,4.6vw,60px)] font-extrabold">{G.h1}</h1>
          {G.intro.map((p, i) => <p key={p} className={`mb-0 mt-3 max-w-[760px] ${i === 0 ? "text-xl" : ""} text-text-2`}>{p}</p>)}
        </div>
      </section>

      {G.groups.map((g, gi) => (
        <Section key={g.h2} labelledBy={`g-${gi}-h2`} tone={gi % 2 === 0 ? "ground" : "white"}>
          <h2 id={`g-${gi}-h2`} className="mb-7 mt-0 text-[clamp(28px,3.6vw,44px)] font-extrabold">{g.h2}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
            {g.photos.map((ph) => (
              <figure key={ph.src} className="m-0 flex flex-col gap-2">
                <div className="h-[340px] overflow-hidden rounded-[14px]"><Photo src={ph.src} alt={ph.alt} width={ph.width} height={ph.height} /></div>
                <figcaption className="text-sm text-text-2">{ph.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      ))}

      <section aria-labelledby="more-h2" className="py-16">
        <div className="wrap">
          <h2 id="more-h2" className="mb-5 mt-0 text-2xl font-extrabold">The services in these photos</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
            {G.services.map((r) => <li key={r.href}><Link href={r.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line px-5 font-bold text-ink no-underline hover:border-action">{r.label}</Link></li>)}
          </ul>
          <p className="mb-0 mt-6"><a href={G.instagram.href} rel="noopener" className="font-bold">{G.instagram.label}</a></p>
        </div>
      </section>

      <CtaBand title="See it in person" body={`${SITE.address.street}, ${SITE.address.city} ${SITE.address.postalCode}.`} primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
    </main>
  );
}
