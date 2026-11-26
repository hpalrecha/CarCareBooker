import { HEADLIGHT } from "@p91/content/site/headlight-restoration";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/exterior-detailing/headlight-restoration";
export const metadata = metadataFor(PATH, HEADLIGHT.hero?.src);

export default async function Page() {
  return <ServicePage content={HEADLIGHT} path={PATH} />;
}
