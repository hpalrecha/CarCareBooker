import { CAR_WASH } from "@p91/content/site/car-wash";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/car-wash";
export const metadata = metadataFor(PATH, CAR_WASH.hero?.src);

export default async function Page() {
  return <ServicePage content={CAR_WASH} path={PATH} />;
}
