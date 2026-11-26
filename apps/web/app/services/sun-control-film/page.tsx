import { SUN_CONTROL_FILM } from "@p91/content/site/sun-control-film";
import { ServicePage } from "@web/components/templates/service-page";
import { metadataFor } from "@web/lib/metadata";

export const revalidate = 300;
const PATH = "/services/sun-control-film";
export const metadata = metadataFor(PATH, SUN_CONTROL_FILM.hero?.src);

export default async function Page() {
  return <ServicePage content={SUN_CONTROL_FILM} path={PATH} />;
}
