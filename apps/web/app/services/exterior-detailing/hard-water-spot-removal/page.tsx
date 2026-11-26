import { HARD_WATER } from "@p91/content/site/hard-water";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/exterior-detailing/hard-water-spot-removal";
export const metadata = metadataFor(PATH, HARD_WATER.hero?.src);

export default async function Page() {
  return <ServicePage content={HARD_WATER} path={PATH} />;
}
