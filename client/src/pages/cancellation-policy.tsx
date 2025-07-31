import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Cancellation Policy</h1>
        <div className="text-gray-300 space-y-6">
          <p className="text-sm text-gray-400 text-center">Last updated: January 2024</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Cancellation Timeline</h2>
            <div className="bg-gray-800 rounded-lg p-6 mt-2">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Cancellation Charges:</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="font-semibold">4+ hours before service</span>
                  <span className="text-green-400 font-bold">FREE Cancellation</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="font-semibold">2-4 hours before service</span>
                  <span className="text-yellow-400 font-bold">50% Charges</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="font-semibold">Less than 2 hours</span>
                  <span className="text-red-400 font-bold">100% Charges</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">No-show</span>
                  <span className="text-red-400 font-bold">100% Charges</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How to Cancel</h2>
            <p>You can cancel your booking through any of these methods:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Online through our website booking management</li>
              <li>Call our customer service: +91 9876543210</li>
              <li>WhatsApp: Send your booking reference number</li>
              <li>Email: cancellation@p91carcare.com</li>
            </ul>
            <p className="mt-4 text-yellow-300">⚠️ Important: Cancellation requests are processed immediately. Make sure you want to cancel before submitting the request.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Cancellation by P91 Car Care</h2>
            <p>We may cancel your service in the following situations:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Severe weather conditions affecting service quality</li>
              <li>Vehicle accessibility issues at your location</li>
              <li>Equipment malfunction or technical difficulties</li>
              <li>Staff illness or emergency situations</li>
            </ul>
            <p className="mt-2 font-semibold text-green-400">If we cancel your service, you will receive a full refund within 3-5 business days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Rescheduling Options</h2>
            <p>Instead of cancelling, you can reschedule your booking:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Free rescheduling up to 4 hours before service</li>
              <li>One-time free rescheduling for emergencies</li>
              <li>Subject to availability of new time slots</li>
              <li>Same service package and pricing applies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Emergency Cancellations</h2>
            <p>We understand that emergencies happen. In case of:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Medical emergencies</li>
              <li>Family emergencies</li>
              <li>Natural disasters or extreme weather</li>
              <li>Vehicle breakdown or accident</li>
            </ul>
            <p className="mt-2">Please contact our customer service immediately. We will review each case individually and may waive cancellation charges based on circumstances.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. No-Show Policy</h2>
            <p>If you are not available at the scheduled time and location:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>We will wait for up to 15 minutes</li>
              <li>Our team will attempt to contact you 3 times</li>
              <li>After 15 minutes, the booking will be marked as "No-Show"</li>
              <li>Full payment will be forfeited</li>
              <li>You will need to make a new booking for future services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Refund Processing</h2>
            <p>Cancellation refunds will be processed as follows:</p>
            <div className="bg-gray-800 rounded-lg p-4 mt-2">
              <ul className="space-y-2">
                <li><span className="font-semibold text-white">Credit/Debit Cards:</span> 5-7 business days</li>
                <li><span className="font-semibold text-white">Net Banking:</span> 3-5 business days</li>
                <li><span className="font-semibold text-white">UPI/Wallets:</span> 1-3 business days</li>
              </ul>
            </div>
            <p className="mt-2 text-gray-400">Note: Actual refund time may vary depending on your bank's processing time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Multiple Cancellations</h2>
            <p>To maintain service quality for all customers:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Customers with 3+ cancellations in a month may face booking restrictions</li>
              <li>Repeat no-shows may result in advance payment requirements</li>
              <li>We reserve the right to refuse service to customers with excessive cancellations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Partial Service Cancellation</h2>
            <p>For package services, if you need to cancel specific components:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Notify us at least 2 hours before service start</li>
              <li>Partial refunds will be calculated based on individual service pricing</li>
              <li>Package discounts may be adjusted accordingly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Holiday and Weekend Cancellations</h2>
            <p>Special terms for services scheduled on holidays and weekends:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Same cancellation policy applies</li>
              <li>Customer service may have limited hours</li>
              <li>Refund processing may be delayed due to bank holidays</li>
              <li>Rescheduling options may be limited due to high demand</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact for Cancellations</h2>
            <p>For cancellations and queries:</p>
            <div className="mt-2">
              <p>Phone: +91 9876543210</p>
              <p>Email: cancellation@p91carcare.com</p>
              <p>WhatsApp: +91 9876543210</p>
              <p>Customer Service Hours: 8:00 AM - 9:00 PM (Mon-Sun)</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}