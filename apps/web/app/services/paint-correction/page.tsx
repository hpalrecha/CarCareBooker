import { PAINT_CORRECTION } from "@p91/content/site/paint-correction";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/paint-correction";
export const metadata = metadataFor(PATH, PAINT_CORRECTION.hero?.src);

export default async function Page() {
  return <ServicePage content={PAINT_CORRECTION} path={PATH} />;
}
