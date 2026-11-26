import { INTERIOR } from "@p91/content/site/interior-detailing";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/interior-detailing";
export const metadata = metadataFor(PATH, INTERIOR.hero?.src);

export default async function Page() {
  return <ServicePage content={INTERIOR} path={PATH} />;
}
