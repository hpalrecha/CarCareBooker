import { PPF } from "@p91/content/site/paint-protection-film";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/paint-protection-film";
export const metadata = metadataFor(PATH, PPF.hero?.src);

export default async function Page() {
  return <ServicePage content={PPF} path={PATH} />;
}
