import { PPF_BIKE } from "@p91/content/site/ppf-bike";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/paint-protection-film/bike";
export const metadata = metadataFor(PATH, PPF_BIKE.hero?.src);

export default async function Page() {
  return <ServicePage content={PPF_BIKE} path={PATH} />;
}
