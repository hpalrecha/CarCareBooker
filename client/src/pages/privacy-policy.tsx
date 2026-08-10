import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-metadata";

export default function PrivacyPolicy() {
  usePageTitle("Privacy Policy — P91 Car Care");
  return (
    <div className="min-h-screen bg-deep-black text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold gradient-text mb-8" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
          
          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">1. Information We Collect</h2>
              <p>Plus Nine One Inc collects the following information when you book our services:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Personal Information:</strong> Name, phone number, email address</li>
                <li><strong>Service Information:</strong> Booking details, service preferences, location</li>
                <li><strong>Payment Information:</strong> Payment details processed securely through Razorpay</li>
                <li><strong>Communication Data:</strong> Messages sent via WhatsApp and email for service updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">2. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Processing and managing your service bookings</li>
                <li>Sending booking confirmations and service updates</li>
                <li>Providing customer support and addressing inquiries</li>
                <li>Processing payments securely through our payment gateway</li>
                <li>Improving our services based on customer feedback</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">3. Information Sharing and Disclosure</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Payment Processors:</strong> Razorpay for secure payment processing</li>
                <li><strong>Service Providers:</strong> WhatsApp Business API and email services for communications</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">4. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>SSL encryption for all data transmission</li>
                <li>Secure payment processing through PCI-compliant gateways</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">5. Data Retention</h2>
              <p>We retain your personal information for as long as necessary to provide services and comply with legal obligations. Booking records are maintained for up to 3 years for service history and warranty purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>File complaints with data protection authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">7. Cookies and Tracking</h2>
              <p>Our website uses essential cookies for functionality and session management. We do not use tracking cookies for advertising purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">8. Updates to Privacy Policy</h2>
              <p>We may update this privacy policy periodically. Changes will be posted on our website with an updated effective date.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">9. Contact Us</h2>
              <p>For privacy-related questions or concerns, please contact us through our customer service channels.</p>
              <p><strong>Business Name:</strong> Plus Nine One Inc</p>
              <p><strong>GST Number:</strong> 29AMIPP3288M1Z6</p>
            </section>

            <div className="mt-12 p-6 bg-medium-gray rounded-lg">
                            <p className="text-sm text-gray-400">
                Last updated: {LEGAL_LAST_UPDATED.privacyPolicy}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                © 2025 Plus Nine One Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}