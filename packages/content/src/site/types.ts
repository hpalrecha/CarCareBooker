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
  family: string | null;                 // key in FAMILIES (price-ranges.ts); null = no range shown
  breadcrumb: LinkItem[];                // excluding Home, including this page last
  eyebrow: string;
  h1: string;
  shortAnswer: string;                   // 40-60 words; "{range}" is replaced with the live range, or its sentence removed
  hero: Photo | null;                    // null = ink panel only, full width
  rangeRows?: { body: "hatchback" | "sedan" | "suv"; label: string; examples: string; moves: string }[];
  rangeNote?: string;                    // shown under the overall range when there are no body rows
  showWarrantyYears?: boolean;           // PPF family only
  sections: Section[];                   // the page's unique body: benefits, how it works, cost factors, coverage
  steps?: Step[];
  work?: (Photo & { caption: string })[];// real P91 photos only
  /** Plan 2b adaptation: before/after pairs (real P91 photos only), shown with the work. */
  beforeAfter?: { before: Photo; after: Photo; caption: string }[];
  reviewNames?: string[];                // names from VERIFIED_REVIEWS to quote
  faq: FaqItem[];                        // "{warranty}" in an answer is replaced with the page's warranty line
  related: LinkItem[];
  /**
   * Plan 2b adaptation: page-specific headings and short labels, so approved copy such as the
   * PPF page's "Three days, five steps" survives the move to the template. Generic text otherwise.
   */
  labels?: {
    rangeLabel?: string;                 // beside the hero range, e.g. "full body, by car size and film"
    pricesH2?: string;
    pricesIntro?: string;
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
};

export type BrandContent = {
  name: string; h1: string; line: string; hero: Photo;
  about: string[]; fits: string[]; benefits: string[];
  genuine?: string[];                    // how to check the product is genuine
  usedIn: LinkItem[]; official: { href: string; label: string } | null;
};

export type GuideContent = {
  slug: string; h1: string; lede: string; date: string; updated?: string; readMinutes: number;
  author: string; reviewedBy: string;    // "[NEEDS: ...]" until the owner names them
  image: Photo;
  blocks: GuideBlock[];                  // migrated BlogBlock[] with links remapped
  mainService: LinkItem; sibling: LinkItem; area: LinkItem;
};
export type GuideBlock =
  | { t: "h2" | "h3"; text: string; id?: string }
  | { t: "p"; text: string; variant?: "lede" | "note" }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "faq"; items: FaqItem[] };
