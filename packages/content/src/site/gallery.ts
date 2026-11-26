import type { Photo } from "./types.ts";

/**
 * /gallery (Plan 2b Task 5). Source: GALLERY_SEO (static-seo.ts:99), STUDIO_PHOTOS and REEL_CAPTIONS
 * (gallery-photos.ts:6, :27). Filtered by the photo catalogue: the STEK window-film frames (p91-stek-*, other
 * installers' footage), the stock steering-wheel shot, the GT-R frame with a graphic overlay and the mislabelled
 * "MG Comet" are dropped. Only the verified photos in apps/web/public/photos are shown, with captions that state
 * the car and what is visible; a job is named only where it is on record (Creta and Vellfire: STEK PPF).
 * The Mahindra collage is captioned without a model name: the photo catalogue says the model is unconfirmed.
 * Reels are not embedded (the sun-film reel is likely other footage); the Instagram link replaces them.
 */
type GPhoto = Photo & { caption: string };
const p = (src: string, alt: string, width: number, height: number, caption: string): GPhoto => ({ src: `/photos/${src}`, alt, width, height, caption });

export const GALLERY = {
  h1: "Our work, up close.", // GALLERY_SEO.h1 (static-seo.ts:99; that module cannot be imported by plain Node)
  intro: [
    "Every photo on this page was taken at the P91 Car Care studio in Adugodi, Bangalore: cars on arrival and at handover, and the work in between. They are our own photographs, not stock images or other studios' work, and each caption says only what the photo shows.",
    "The studio has two areas you will see in the pictures. The wash bay, with its corrugated walls and green grass wall, is where every car starts: a foam pre-wash, a hand wash and decontamination, so that nothing gritty is left on the paint. The fitting bay, with its dark panelled walls, grid of LED lights and the STEK, Nasiol and P91 signs, is where paint is inspected and polished and where film and coating go on. The bright, even light is there on purpose: swirls, high spots and film edges are easiest to see under it.",
    "Paint protection film is fitted panel by panel, with edges wrapped where the panel allows. Ceramic coating goes on after the paint has been corrected, one panel at a time, and cures before the car leaves. Polishing photos show the machine work that removes swirls and water-spot etching before anything is applied. Headlight, interior and wash photos show the smaller jobs that keep a car looking cared for.",
    "If you want to see a particular car or finish in person, visit the studio or send us a message: owners are welcome to see the film rolls and the batch details before work starts. More work, including short videos, is on our Instagram.",
  ],
  groups: [
    {
      h2: "Finished cars at the studio",
      photos: [
        p("creta-stek-ppf-studio.webp", "Black Hyundai Creta in the P91 studio beside the STEK wall", 3420, 1925, "Hyundai Creta · STEK PPF"),
        p("vellfire-stek-wall.webp", "White Toyota Vellfire beside the STEK wall", 958, 732, "Toyota Vellfire · STEK PPF"),
        p("mahindra-be6-arrival-handover.webp", "Dark blue Mahindra electric SUV on arrival in the wash bay (top) and at handover beside the STEK wall (bottom)", 1473, 1962, "Mahindra electric SUV · arrival and handover"),
        p("xuv700-stek-wall.webp", "Dark blue Mahindra XUV700 in front of the STEK wall", 1120, 1316, "Mahindra XUV700"),
        p("gle-nasiol-wall.webp", "White Mercedes-Benz GLE in front of the Nasiol wall", 1084, 911, "Mercedes-Benz GLE"),
        p("evoque-studio.webp", "White Range Rover Evoque with copper roof under the P91 wall logo", 1038, 1418, "Range Rover Evoque"),
      ],
    },
    {
      h2: "Paint protection film going on",
      photos: [
        p("ppf-install-door-handle.webp", "A P91 fitter tucking paint protection film around a door handle", 720, 1280, "Tucking film around a door handle"),
        p("ppf-install-rear-quarter.webp", "P91 installer positioning PPF on the rear quarter of a black SUV", 720, 1280, "Positioning film on a rear quarter"),
        p("ppf-install-door-edge.webp", "P91 installer fitting clear PPF around the rear door of a black SUV", 720, 1280, "Wrapping a door edge"),
      ],
    },
    {
      h2: "Polishing and coating",
      photos: [
        p("polish-porsche-bonnet.webp", "Machine polisher beside the bonnet crest of a Porsche", 800, 1422, "Machine polishing a Porsche bonnet"),
        p("polish-red-bonnet.webp", "Rotary polisher with a foam pad on the glossy bonnet of a red car", 720, 1280, "Rotary polishing, foam pad"),
        p("polish-red-bonnet-wool.webp", "Rotary polisher with a wool pad on the bonnet of a red car", 720, 1280, "Rotary polishing, wool pad"),
        p("ceramic-wipe-bonnet.webp", "Applicator block wiping ceramic coating onto a bonnet", 720, 1280, "Ceramic coating, panel by panel"),
      ],
    },
    {
      h2: "Before and after, headlights, interior and wash",
      photos: [
        p("i20-before-bird-droppings.webp", "Before: orange Hyundai i20 with bird droppings on the bonnet", 1400, 1867, "Hyundai i20 · before"),
        p("i20-after-studio.webp", "After: the same orange Hyundai i20, glossy, in the P91 studio", 1400, 2488, "Hyundai i20 · after polishing"),
        p("headlight-polish-lens.webp", "Gloved hand polishing a hazy headlight lens", 800, 1422, "Headlight restoration in progress"),
        p("headlight-restored-jetta.webp", "Clear, restored headlight of a champagne Volkswagen Jetta", 800, 1422, "Volkswagen Jetta · restored headlight"),
        p("interior-vacuum-footwell.webp", "Vacuuming debris from a rear footwell carpet", 800, 1422, "Interior detailing"),
        p("wash-foam-macan.webp", "Foam-covered Porsche Macan being hand washed with a mitt", 800, 882, "Porsche Macan · hand wash"),
        p("wash-foam-vellfire.webp", "Foam sprayed along the side of a white Toyota Vellfire", 800, 1422, "Toyota Vellfire · foam pre-wash"),
      ],
    },
  ],
  instagram: { href: "https://www.instagram.com/p91carcare/", label: "See more of our work on Instagram" },
  services: [
    { href: "/services/paint-protection-film", label: "Paint protection film" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/interior-detailing", label: "Interior detailing" },
  ],
};
