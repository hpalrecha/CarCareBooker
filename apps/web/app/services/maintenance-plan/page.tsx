import { MAINTENANCE_PLAN } from "@p91/content/site/maintenance-plan";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/maintenance-plan";
export const metadata = metadataFor(PATH, MAINTENANCE_PLAN.hero?.src);

export default async function Page() {
  return <ServicePage content={MAINTENANCE_PLAN} path={PATH} />;
}
