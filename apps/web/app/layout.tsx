import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE } from "@web/lib/site";
import { SiteHeader } from "@web/components/site-header";
import { SiteFooter } from "@web/components/site-footer";
import { JsonLd } from "@web/components/json-ld";
import { businessSchema } from "@web/lib/schema";
import { getBusinessHours } from "@web/lib/api";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: { default: "PPF and ceramic coating in Bangalore | P91 Car Care", template: "%s | P91 Car Care" },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
};

export const viewport: Viewport = { themeColor: "#12211B" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hours = await getBusinessHours().catch(() => []);
  return (
    <html lang="en-IN" className={jakarta.variable}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <JsonLd data={businessSchema(hours)} />
      </body>
    </html>
  );
}
