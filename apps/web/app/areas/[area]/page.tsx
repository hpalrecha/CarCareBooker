import { KORAMANGALA, HSR_LAYOUT, INDIRANAGAR } from "@p91/content/site/areas";
import { AreaPage } from "@web/components/templates/area-page";
import { metadataFor } from "@web/lib/metadata";

const AREAS = { koramangala: KORAMANGALA, "hsr-layout": HSR_LAYOUT, indiranagar: INDIRANAGAR } as const;
type Slug = keyof typeof AREAS;

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(AREAS).map((area) => ({ area }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  return metadataFor(`/areas/${area}`);
}

export default async function Page({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  return <AreaPage content={AREAS[area as Slug]} path={`/areas/${area}`} />;
}
