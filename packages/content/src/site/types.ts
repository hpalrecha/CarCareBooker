export type FaqItem = { q: string; a: string };
export type ProofPhoto = { src: string; alt: string; width: number; height: number; caption: string };
export type PageEntry = {
  path: string;
  title: string;
  description: string;
  lastmod: string;
  changefreq?: "weekly" | "monthly";
  content: unknown;
};

// ── Plan 2b templates ──
export type Photo = { src: string; alt: string; width: number; height: number };
export type Step = { title: string; text: string; photo: Photo | null };
/** `photo` is optional (Plan 2b adaptation): the PPF coverage section kept its approved photo. */
export type Section = { h2: string; paras: string[]; bullets?: string[]; photo?: Photo };
export type LinkItem = { href: string; label: string };

export type ServiceContent = {
  family: string | null;                 // key in FAMILIES (price-ranges.ts); unused while the site shows no prices (owner, 26 Nov)
  breadcrumb: LinkItem[];                // excluding Home, including this page last
  eyebrow: string;
  h1: string;
  shortAnswer: string;                   // 40-60 words; no money (owner, 26 Nov); "{time}" = catalogue studio time
  hero: Photo | null;                    // null = ink panel only, full width
  showWarrantyYears?: boolean;           // PPF family only
  sections: Section[];                   // the page's unique body: benefits, how it works, cost factors, coverage
  steps?: Step[];
  work?: (Photo & { caption: string })[];// real P91 photos only
  /** Plan 2b adaptation: before/after pairs (real P91 photos only), shown with the work. */
  beforeAfter?: { before: Photo; after: Photo; caption: string }[];
  reviewNames?: string[];                // names from VERIFIED_REVIEWS to quote
  /**
   * Plan 2b adaptation (batch B): read facts from one catalogue row instead of typing them.
   * `timeSlug`: "{time}" in shortAnswer becomes that row's studio time (formatServiceTime), or its sentence is dropped.
   * `catalogueIncludes`: a section listing that row's whatIncluded (withheld claims, prices and warranty lines dropped).
   */
  timeSlug?: string;
  catalogueIncludes?: { slug: string; h2: string; intro?: string };
  faq: FaqItem[];                        // "{warranty}" in an answer is replaced with the page's warranty line
  related: LinkItem[];
  /**
   * Plan 2b adaptation: page-specific headings and short labels, so approved copy such as the
   * PPF page's "Three days, five steps" survives the move to the template. Generic text otherwise.
   */
  labels?: {
    stepsH2?: string;
    workH2?: string;
    faqH2?: string;
    relatedH2?: string;
    cta?: { title: string; body: string };
  };
};

export type AreaContent = {
  area: string; h1: string; intro: string;
  facts: { k: string; v: string }[];     // drive time, pickup ("On request, confirmed on a call"), hours, phone
  routeNote: string;
  services: { h3: string; text: string; href: string; link: string }[]; // area-specific text per service
  jobs: (Photo & { caption: string })[]; // real jobs for owners from this area; [] until supplied
  faq: FaqItem[];
  nearby: LinkItem[];
  sections?: Section[];                  // Plan 2b adaptation: extra area sections (Koramangala keeps its blog checklist)
};

export type BrandContent = {
  name: string; h1: string; line: string; hero: Photo;
  about: string[]; fits: string[]; benefits: string[];
  genuine?: string[];                    // how to check the product is genuine
  usedIn: LinkItem[]; official: { href: string; label: string } | null;
  /** Owner, 26 Nov 2026: brand pages to ~800 words. Extra sections (what it is, how P91 uses it, what it suits, care). */
  sections?: Section[];
  genuineIntro?: string[];               // paragraphs above the "how to check it is genuine" list
  faq?: FaqItem[];
};

export type GuideContent = {
  slug: string; h1: string; lede: string; date: string; updated?: string; readMinutes: number;
  author: string; reviewedBy: string;    // "[NEEDS: ...]" until the owner names them
  image: Photo | null;                   // null when no verified photo matches the topic
  blocks: GuideBlock[];                  // migrated BlogBlock[] with links remapped
  mainService: LinkItem; sibling: LinkItem; area: LinkItem;
};
export type GuideBlock =
  | { t: "h2" | "h3"; text: string; id?: string }
  | { t: "p"; text: string; variant?: "lede" | "note" }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "faq"; items: FaqItem[] };
