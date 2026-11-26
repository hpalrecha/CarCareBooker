import { CERAMIC } from "@p91/content/site/ceramic-coating";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/ceramic-coating";
export const metadata = metadataFor(PATH, CERAMIC.hero?.src);

export default async function Page() {
  return <ServicePage content={CERAMIC} path={PATH} />;
}
