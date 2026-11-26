import { GLASS_COATING } from "@p91/content/site/windshield-glass-coating";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/sun-control-film/windshield-glass-coating";
export const metadata = metadataFor(PATH, GLASS_COATING.hero?.src);

export default async function Page() {
  return <ServicePage content={GLASS_COATING} path={PATH} />;
}
