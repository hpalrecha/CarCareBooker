import { PPF_FRONT } from "@p91/content/site/ppf-front";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/paint-protection-film/front";
export const metadata = metadataFor(PATH, PPF_FRONT.hero?.src);

export default async function Page() {
  return <ServicePage content={PPF_FRONT} path={PATH} />;
}
