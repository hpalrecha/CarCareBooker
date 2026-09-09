import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { LEGAL_LAST_UPDATED, COMPANY_NAME, copyrightYear } from "@/lib/legal-metadata";

export default function RefundPolicy() {
  usePageTitle("Refund Policy — P91 Car Care");
  return (
    <div className="min-h-screen bg-deep-black text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold gradient-text mb-8" data-testid="text-refund-title">
            Refund & Cancellation Policy
          </h1>
          
          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">1. Booking Fee Refund Policy</h2>
              <p>Plus Nine One Inc charges a booking fee of ₹299 to secure your appointment. This policy outlines our refund terms:</p>
              {/* A refund policy has to say what happens when there is nothing to refund. */}
              <p className="mt-3"><strong className="text-white">During a free-booking offer</strong> no fee is charged, so there is nothing to refund — cancel any time at no cost by calling or messaging us. The cancellation terms below apply only to bookings where a fee was actually paid.</p>
              
              <div className="bg-medium-gray p-6 rounded-lg mt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Cancellation Timeline:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>24+ hours before service:</strong> Full refund of ₹299 booking fee</li>
                  <li><strong>12-24 hours before service:</strong> 50% refund (₹149.50)</li>
                  <li><strong>Less than 12 hours:</strong> No refund (₹0)</li>
                  <li><strong>Same-day cancellation:</strong> No refund</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">2. Service-Specific Refund Terms</h2>
              
              <div className="space-y-4">
                <div className="bg-medium-gray p-4 rounded-lg">
                  <h3 className="text-white font-semibold">Premium Car Wash (₹599)</h3>
                  <p>Full service refund if not satisfied within 2 hours of completion</p>
                </div>
                
                <div className="bg-medium-gray p-4 rounded-lg">
                  <h3 className="text-white font-semibold">Interior Detailing (₹2,499)</h3>
                  <p>Partial refund available if service standards not met</p>
                </div>
                
                <div className="bg-medium-gray p-4 rounded-lg">
                  <h3 className="text-white font-semibold">Exterior Detailing (₹1,999)</h3>
                  <p>Warranty-backed service with satisfaction guarantee</p>
                </div>
                
                <div className="bg-medium-gray p-4 rounded-lg">
                  <h3 className="text-white font-semibold">Windshield Glass Coating (₹1,399)</h3>
                  <p>No refund after application due to material usage</p>
                </div>
                
                <div className="bg-medium-gray p-4 rounded-lg">
                  <h3 className="text-white font-semibold">Headlight Restoration (₹1,199)</h3>
                  <p>Warranty-backed with quality guarantee</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">3. Refund Processing Timeline</h2>
              <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Refunds are processed within:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Credit/Debit Cards:</strong> 5-7 working days</li>
                  <li><strong>UPI/Net Banking:</strong> 3-5 working days</li>
                  <li><strong>Digital Wallets:</strong> 2-3 working days</li>
                </ul>
                <p className="mt-4 text-yellow-400">
                  <strong>Note:</strong> Refund timeline may vary based on your bank's processing time. Plus Nine One Inc initiates refunds immediately upon approval.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">4. Weather-Related Cancellations</h2>
              <p>In case of adverse weather conditions that prevent service delivery:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Full refund or rescheduling at no extra cost</li>
                <li>Customer will be notified 2-4 hours in advance</li>
                <li>Priority rescheduling for the next available slot</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">5. Service Quality Guarantee</h2>
              <p>We stand behind our work quality:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>100% satisfaction guarantee on all services</li>
                <li>Free rework if service standards not met</li>
                <li>Partial refund for unsatisfactory work after rework attempt</li>
                <li>Insurance coverage for any accidental damage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">6. How to Request a Refund</h2>
              <p>To request a refund:</p>
              <ol className="list-decimal ml-6 space-y-2">
                <li>Contact our customer service within 24 hours of service</li>
                <li>Provide booking ID and reason for refund</li>
                <li>Allow 1-2 business days for refund approval</li>
                <li>Refund will be processed to original payment method</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">7. Non-Refundable Situations</h2>
              <p>Refunds will not be provided in the following cases:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Customer unavailability during scheduled time</li>
                <li>Lack of vehicle access at service location</li>
                <li>Pre-existing vehicle damage not reported before service</li>
                <li>Services completed as per agreed specifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">8. Contact Information</h2>
              <p><strong>Business Name:</strong> Plus Nine One Inc</p>
              <p><strong>GST Number:</strong> 29AMIPP3288M1Z6</p>
              <p>For refund requests or questions, please contact us through our customer service channels.</p>
            </section>

            <div className="mt-12 p-6 bg-medium-gray rounded-lg">
              <p className="text-sm text-gray-400">
                Last updated: {LEGAL_LAST_UPDATED.refundPolicy}
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