import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Terms of Service</h1>
        <div className="text-gray-300 space-y-6">
          <p className="text-sm text-gray-400 text-center">Last updated: January 2024</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using P91 Car Care's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
            <p>P91 Car Care provides professional car detailing and maintenance services in Bangalore, Karnataka. Our services include but are not limited to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Interior deep cleaning</li>
              <li>Glass coating and protection</li>
              <li>Headlight restoration</li>
              <li>Premium wash and detailing</li>
              <li>Paint protection services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Booking and Payment</h2>
            <p>All bookings must be made through our online platform. Payment is required at the time of booking through our secure payment gateway powered by Razorpay. We accept:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Credit and debit cards</li>
              <li>Net banking</li>
              <li>UPI payments</li>
              <li>Digital wallets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Service Guarantee</h2>
            <p>We guarantee 100% satisfaction with our services. If you are not completely satisfied with our work, we will:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Redo the service at no additional cost, or</li>
              <li>Provide a full refund within 24 hours of service completion</li>
            </ul>
            <p className="mt-2">This guarantee is valid for 7 days from the date of service completion.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cancellation Policy</h2>
            <p>You may cancel your booking:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Up to 4 hours before scheduled service time for a full refund</li>
              <li>2-4 hours before service time for 50% refund</li>
              <li>Less than 2 hours before service time - no refund</li>
            </ul>
            <p className="mt-2">Cancellations can be made through our customer service or online platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Liability and Insurance</h2>
            <p>P91 Car Care maintains comprehensive insurance coverage for all services. However, our liability is limited to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Direct damages caused by our negligence during service</li>
              <li>Maximum liability not exceeding the service fee paid</li>
              <li>No liability for pre-existing vehicle damage</li>
              <li>No liability for items left in the vehicle</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Customer Responsibilities</h2>
            <p>As a customer, you agree to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide accurate vehicle and contact information</li>
              <li>Remove all personal items from the vehicle</li>
              <li>Ensure vehicle accessibility at scheduled time</li>
              <li>Report any concerns within 24 hours of service</li>
              <li>Treat our staff with respect and courtesy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Privacy and Data Protection</h2>
            <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using our services, you consent to our data practices as described in our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Intellectual Property</h2>
            <p>All content on our website and mobile application, including logos, text, images, and software, is the property of P91 Car Care and is protected by intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Dispute Resolution</h2>
            <p>Any disputes arising from our services will be resolved through:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Direct communication with our customer service team</li>
              <li>Mediation if necessary</li>
              <li>Jurisdiction under the courts of Bangalore, Karnataka</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on our website. Continued use of our services constitutes acceptance of the modified terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us:</p>
            <div className="mt-2">
              <p>Email: support@p91carcare.com</p>
              <p>Phone: +91 74066 19191</p>
              <p>Address: Bangalore, Karnataka, India</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}