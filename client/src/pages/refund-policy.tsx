import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Refund Policy</h1>
        <div className="text-gray-300 space-y-6">
          <p className="text-sm text-gray-400 text-center">Last updated: January 2024</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. 100% Satisfaction Guarantee</h2>
            <p>At P91 Car Care, we stand behind the quality of our work. If you are not completely satisfied with our service, we offer a 100% satisfaction guarantee.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Refund Eligibility</h2>
            <p>You are eligible for a full refund if:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Service quality does not meet our promised standards</li>
              <li>Service was not completed as booked</li>
              <li>You are unsatisfied with the results within 24 hours of completion</li>
              <li>We are unable to provide the service as scheduled</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Refund Process</h2>
            <p>To request a refund:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Contact our customer service within 24 hours of service completion</li>
              <li>Provide details about your concern and booking reference</li>
              <li>Our team will review your request within 24 hours</li>
              <li>If approved, refund will be processed within 5-7 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Refund Timeline by Cancellation</h2>
            <div className="bg-gray-800 rounded-lg p-4 mt-2">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Cancellation Refund Schedule:</h3>
              <ul className="space-y-2">
                <li><span className="font-semibold text-white">4+ hours before service:</span> 100% refund</li>
                <li><span className="font-semibold text-white">2-4 hours before service:</span> 50% refund</li>
                <li><span className="font-semibold text-white">Less than 2 hours:</span> No refund</li>
                <li><span className="font-semibold text-white">No-show:</span> No refund</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Refund Methods</h2>
            <p>Refunds will be processed through the same payment method used for the original transaction:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Credit/Debit Card: 5-7 business days</li>
              <li>Net Banking: 3-5 business days</li>
              <li>UPI/Digital Wallets: 1-3 business days</li>
              <li>Bank transfers may take additional time depending on your bank</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Non-Refundable Situations</h2>
            <p>Refunds will not be provided in the following cases:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Customer satisfaction issues reported after 7 days</li>
              <li>Damage caused by customer negligence or pre-existing conditions</li>
              <li>Services completed as per agreed specifications</li>
              <li>Change of mind without valid service quality concerns</li>
              <li>No-show or late cancellation fees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Partial Refunds</h2>
            <p>In some cases, we may offer partial refunds for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Services partially completed due to unforeseen circumstances</li>
              <li>Package services where only some components were unsatisfactory</li>
              <li>Agreed resolution through customer service discussion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Service Credits</h2>
            <p>As an alternative to monetary refunds, we may offer:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Free re-service to address quality concerns</li>
              <li>Service credits for future bookings</li>
              <li>Complementary additional services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Payment Gateway Charges</h2>
            <p>Please note that payment gateway charges are non-refundable. Any processing fees deducted by the payment provider (Razorpay) will not be included in the refund amount.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Dispute Resolution</h2>
            <p>If you are not satisfied with our refund decision, you may:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Escalate the matter to our management team</li>
              <li>Request mediation through customer service</li>
              <li>Contact Razorpay for payment-related disputes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact for Refunds</h2>
            <p>To request a refund or discuss concerns:</p>
            <div className="mt-2">
              <p>Email: refunds@p91carcare.com</p>
              <p>Phone: +91 9876543210</p>
              <p>Customer Service Hours: 9:00 AM - 8:00 PM (Mon-Sun)</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}