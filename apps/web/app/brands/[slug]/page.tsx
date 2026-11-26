import { BRANDS } from "@p91/content/site/brands";
import { BrandPage } from "@web/components/templates/brand-page";
import { metadataFor } from "@web/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(BRANDS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataFor(`/brands/${slug}`, BRANDS[slug].hero.src);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BrandPage content={BRANDS[slug]} path={`/brands/${slug}`} />;
}
