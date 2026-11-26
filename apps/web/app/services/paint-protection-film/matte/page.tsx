import { PPF_MATTE } from "@p91/content/site/ppf-matte";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/paint-protection-film/matte";
export const metadata = metadataFor(PATH, PPF_MATTE.hero?.src);

export default async function Page() {
  return <ServicePage content={PPF_MATTE} path={PATH} />;
}
