import { PAGES } from "@p91/content/site/registry";
import { SITE } from "@web/lib/site";

export const revalidate = 3600;

export function GET() {
  const lines = [
    `# ${SITE.name}`,
    "",
    `> Paint protection film (STEK, P91 Premium), ceramic coating (Nasiol) and detailing studio at ${SITE.address.street}, ${SITE.address.city} ${SITE.address.postalCode}. Phone ${SITE.phone}. Prices are shown as ranges by car size; exact quotes on WhatsApp.`,
    "",
    "## Pages",
    ...PAGES.map((p) => `- [${p.title}](${new URL(p.path, SITE.origin)}): ${p.description}`),
  ];
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
