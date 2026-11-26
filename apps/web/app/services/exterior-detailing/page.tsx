import { EXTERIOR } from "@p91/content/site/exterior-detailing";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/exterior-detailing";
export const metadata = metadataFor(PATH, EXTERIOR.hero?.src);

export default async function Page() {
  return <ServicePage content={EXTERIOR} path={PATH} />;
}
