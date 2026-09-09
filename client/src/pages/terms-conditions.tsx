import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { LEGAL_LAST_UPDATED, COMPANY_NAME, copyrightYear } from "@/lib/legal-metadata";
import {
  FOOTER_SERVICES,
  formatINR,
  resolveCanonical,
  type ServiceRecord,
} from "@/lib/canonical-services";

export default function TermsConditions() {
  usePageTitle("Terms & Conditions — P91 Car Care");
  const { data: services } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });
  const termsServices = FOOTER_SERVICES
    .map((entry) => resolveCanonical(services, entry))
    .filter((row): row is ServiceRecord => row !== null);
  return (
    <div className="min-h-screen bg-deep-black text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold gradient-text mb-8" data-testid="text-terms-title">
            Terms and Conditions
          </h1>
          
          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">1. Business Information</h2>
              <p><strong>Company Name:</strong> Plus Nine One Inc</p>
              <p><strong>GST Number:</strong> 29AMIPP3288M1Z6</p>
              <p><strong>Business Type:</strong> Car Detailing and Maintenance Services</p>
              <p><strong>Location:</strong> Bangalore, Karnataka, India</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">2. Service Agreement</h2>
              <p>By booking our services through P91 Car Care portal, you agree to these terms and conditions. Our services include:</p>
              {/* Read from the live active-service records rather than restated here.
                  This list previously named a "Premium Car Wash - ₹599" that does not
                  exist and quoted ₹1,999 for exterior detailing when the real price is
                  ₹2,999 — a pricing contradiction inside the contractual terms. */}
              <ul className="list-disc ml-6 space-y-2" data-testid="list-terms-services">
                {termsServices.map((row) => (
                  <li key={row.id}>
                    {row.title.trim()} - {formatINR(row.price)}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-400">
                This list reflects our current published prices. The price shown on the
                service page at the time of booking is the price that applies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">3. Booking and Payment Terms</h2>
              <p>A booking fee of ₹299 is required to secure your appointment. This amount will be adjusted against the total service cost. All prices are listed in Indian Rupees (INR) and include applicable taxes.</p>
              {/* Kept as a standing clause rather than rewritten: the fee is the normal terms,
                  and the offer is a temporary waiver of it. Without this sentence the page
                  would contradict a site that is visibly taking bookings for nothing. */}
              <p><strong className="text-white">Promotional periods:</strong> During an advertised free-booking offer, no booking fee is charged and no advance payment is taken. Your appointment is confirmed on your contact details alone, and the full service cost is settled at the studio after the work is completed.</p>
              <p>Payment is processed securely through Razorpay. We accept all major credit cards, debit cards, UPI, and net banking.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">4. Service Delivery</h2>
              <p>Services are provided at your designated location in Bangalore. Our team will arrive within the scheduled time slot. Please ensure vehicle accessibility and availability of water connection if required.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">5. Liability and Insurance</h2>
              <p>Plus Nine One Inc maintains comprehensive insurance coverage for all services. We are not liable for pre-existing damage to vehicles. Any concerns should be reported before service commencement.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">6. Modification of Terms</h2>
              <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on our website. Continued use of our services constitutes acceptance of modified terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">7. Contact Information</h2>
              <p>For any questions regarding these terms, please contact us through our booking portal or customer service channels.</p>
            </section>

            <div className="mt-12 p-6 bg-medium-gray rounded-lg">
              <p className="text-sm text-gray-400">
                Last updated: {LEGAL_LAST_UPDATED.termsConditions}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                © {copyrightYear()} {COMPANY_NAME}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}