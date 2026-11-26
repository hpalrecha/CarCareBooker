import { CERAMIC_BIKE } from "@p91/content/site/ceramic-coating-bike";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/ceramic-coating/bike";
export const metadata = metadataFor(PATH, CERAMIC_BIKE.hero?.src);

export default async function Page() {
  return <ServicePage content={CERAMIC_BIKE} path={PATH} />;
}
