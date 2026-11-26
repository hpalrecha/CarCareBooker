import { LEGAL } from "@p91/content/site/legal";
import { LegalPage, legalMetadata } from "@web/components/templates/legal-page";

export const metadata = legalMetadata(LEGAL.terms);

export default function Page() {
  return <LegalPage content={LEGAL.terms} />;
}
