/**
 * The studio photographs on /gallery ("Inside the studio"): file, alt text and caption. One list for the
 * page and for its crawlable snapshot, so the raw HTML carries the same real, described images.
 */
const G = "/attached_assets/gallery/";
export const STUDIO_PHOTOS = [
  { src: "p91-lux-range-rover-evoque.webp", alt: "Range Rover Evoque finished at P91 Car Care", tag: "Range Rover Evoque · P91 Premium PPF" },
  { src: "p91-ppf-fitting.webp", alt: "Paint protection film being fitted on a car panel", tag: "PPF fitting" },
  { src: "p91-lux-vellfire.webp", alt: "Toyota Vellfire after detailing", tag: "Toyota Vellfire · STEK PPF" },
  { src: "p91-ceramic-gloss-wipe.webp", alt: "Ceramic coating gloss being wiped in", tag: "Ceramic coating" },
  { src: "p91-lux-nissan-gtr.webp", alt: "Nissan GT-R protected at P91 Car Care", tag: "Nissan GT-R · STEK PPF" },
  { src: "p91-stek-film-squeegee.webp", alt: "STEK film being squeegeed onto a window", tag: "STEK film" },
  { src: "p91-lux-mercedes-gle.webp", alt: "Mercedes GLE detailed at the studio", tag: "Mercedes GLE" },
  { src: "p91-polish-bonnet-gloss.webp", alt: "Bonnet gloss after machine polishing", tag: "Polishing" },
  { src: "p91-lux-mg-comet-ev.webp", alt: "MG Comet EV protected with film", tag: "MG Comet EV" },
  { src: "p91-ppf-vellfire-handover.webp", alt: "Vellfire handover after PPF", tag: "Handover" },
  { src: "p91-lux-xuv700.webp", alt: "Mahindra XUV700 after detailing", tag: "Mahindra XUV700" },
  { src: "p91-stek-heat-glove.webp", alt: "Heat-shaping STEK film at the studio", tag: "STEK film" },
  { src: "p91-lux-innova-hycross.webp", alt: "Toyota Innova Hycross detailed at P91", tag: "Innova Hycross · STEK PPF" },
  { src: "p91-interior-steering-detail.webp", alt: "Interior steering wheel detailing", tag: "Interior detail" },
  { src: "p91-lux-bmw-3-series.webp", alt: "BMW 3 Series finished at P91 Car Care", tag: "BMW 3 Series" },
  { src: "p91-ceramic-door-finish.webp", alt: "Ceramic coated door finish", tag: "Ceramic finish" },
].map((p) => ({ ...p, src: G + p.src }));

