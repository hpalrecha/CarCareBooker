import Link from "next/link";
import { ABOUT as A } from "@p91/content/site/contact-about";
import { metadataFor } from "@web/lib/metadata";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { CtaBand } from "@web/components/cta-band";
import { RichText } from "@web/components/rich-text";

const PATH = "/about";
const PHOTO = { src: "/photos/i20-after-studio.webp", alt: "Orange Hyundai i20 in the P91 studio in Adugodi, under the Nasiol wall sign", width: 1400, height: 2488 };
export const metadata = metadataFor(PATH, PHOTO.src);

const H2 = "m-0 text-[clamp(30px,4vw,48px)] font-extrabold";

/** /about: what the studio is, how it works, the team ([NEEDS] until the owner supplies it), and the studio itself. */
export default function AboutPage() {
  return (
    <main>
      <section aria-labelledby="about-h1" className="pb-14 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "About", path: PATH }]} />
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="flex min-w-0 flex-[1_1_480px] flex-col justify-center gap-4 rounded-[16px] bg-ink p-8 text-white md:p-10">
              <h1 id="about-h1" className="m-0 text-[clamp(34px,4.2vw,56px)] font-extrabold">{A.h1}</h1>
              <p className="m-0 text-xl font-bold text-on-ink">{A.h2}</p>
              <p className="m-0 text-lg text-white/85">{A.lede}</p>
            </div>
            <div className="max-h-[560px] min-h-[380px] min-w-0 flex-[1_1_320px] overflow-hidden rounded-[16px]">
              <Photo src={PHOTO.src} alt={PHOTO.alt} width={PHOTO.width} height={PHOTO.height} priority />
            </div>
          </div>
          <p className="mb-0 mt-8 max-w-[760px] text-text-2">{A.intro}</p>
          <dl className="m-0 mt-6 grid max-w-[760px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            {A.specs.map((s) => <div key={s.k}><dt className="text-sm font-semibold text-muted">{s.k}</dt><dd className="m-0 font-bold">{s.v}</dd></div>)}
          </dl>
        </div>
      </section>

      <Section labelledBy="how-h2" tone="ground">
        <h2 id="how-h2" className={`${H2} mb-6`}>{A.how.h2}</h2>
        <ul className="m-0 flex max-w-[760px] flex-col gap-3 pl-5 text-text-2">{A.how.items.map((i) => <li key={i}><RichText text={i} /></li>)}</ul>
      </Section>

      <Section labelledBy="team-h2">
        <h2 id="team-h2" className={`${H2} mb-5`}>{A.team.h2}</h2>
        {A.team.paras.map((p) => <p key={p} className="mb-3.5 mt-0 max-w-[760px] text-text-2"><RichText text={p} /></p>)}
      </Section>

      <Section labelledBy="studio-h2" tone="ground">
        <h2 id="studio-h2" className={`${H2} mb-5`}>{A.studio.h2}</h2>
        {A.studio.paras.map((p) => <p key={p} className="mb-3.5 mt-0 max-w-[760px] text-text-2"><RichText text={p} /></p>)}
        <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
          <li><Link href="/gallery" className="font-bold">See the work in the gallery</Link></li>
          <li><Link href="/brands" className="font-bold">The brands we fit</Link></li>
          <li><Link href="/contact" className="font-bold">Find the studio</Link></li>
        </ul>
      </Section>

      <div className="pt-16" />
      <CtaBand title="Visit before you book" body={`${SITE.address.street}, ${SITE.address.city} ${SITE.address.postalCode}.`} primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
    </main>
  );
}
