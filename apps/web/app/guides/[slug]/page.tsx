import { GUIDES, guideFor } from "@p91/content/site/guides";
import { pageFor } from "@p91/content/site/registry";
import { GuidePage } from "@web/components/templates/guide-page";
import { metadataFor } from "@web/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataFor(`/guides/${slug}`, guideFor(slug).image?.src);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = `/guides/${slug}`;
  return <GuidePage content={guideFor(slug)} path={path} description={pageFor(path).description} />;
}
