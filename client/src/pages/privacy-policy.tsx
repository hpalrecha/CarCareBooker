import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>
        <div className="text-gray-300 space-y-6">
          <p className="text-sm text-gray-400 text-center">Last updated: January 2024</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p>P91 Car Care ("we," "our," or "us") collects the following information when you use our services:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Personal identification information (Name, email address, phone number)</li>
              <li>Vehicle information (make, model, year, license plate)</li>
              <li>Service preferences and booking history</li>
              <li>Payment information (processed securely through Razorpay)</li>
              <li>Location data for service delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide car detailing and maintenance services</li>
              <li>Process payments and manage bookings</li>
              <li>Send service confirmations and updates via WhatsApp/Email</li>
              <li>Improve our services and customer experience</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Payment Processing</h2>
            <p>All payments are processed securely through Razorpay. We do not store your credit card or payment information on our servers. Razorpay handles all payment data in compliance with industry security standards including PCI DSS compliance.</p>
            <p className="mt-2">For more information about Razorpay's privacy practices, please visit: <a href="https://razorpay.com/privacy/" className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">Razorpay Privacy Policy</a></p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>With service providers who assist in our operations (payment processing, communication services)</li>
              <li>When required by law or to protect our rights</li>
              <li>In case of business transfer or merger</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure payment processing through Razorpay</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>File a complaint with relevant authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to enhance your browsing experience and analyze website usage. You can control cookie settings through your browser preferences.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="mt-2">
              <p>Email: privacy@p91carcare.com</p>
              <p>Phone: +91 9876543210</p>
              <p>Address: Bangalore, Karnataka, India</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}