import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";

export default function TermsConditions() {
  usePageTitle("Terms & Conditions — P91 Car Care");
  return (
    <div className="min-h-screen bg-deep-black text-white">
      {/* Header */}
      <div className="glass-effect border-b border-medium-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/Car Care (4)_1753951564515.png" 
                alt="P91 Car Care" 
                className="h-8 w-auto"
                data-testid="img-logo-terms"
              />
              <h1 className="text-xl font-semibold gradient-text">
                Plus Nine One Inc
              </h1>
            </div>
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-white" data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

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
              <ul className="list-disc ml-6 space-y-2">
                <li>Premium Car Wash - ₹599</li>
                <li>Interior Detailing - ₹2,499</li>
                <li>Exterior Detailing - ₹1,999</li>
                <li>Windshield Glass Coating - ₹1,399</li>
                <li>Headlight Restoration - ₹1,199</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neon-green mb-4">3. Booking and Payment Terms</h2>
              <p>A booking fee of ₹299 is required to secure your appointment. This amount will be adjusted against the total service cost. All prices are listed in Indian Rupees (INR) and include applicable taxes.</p>
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
                Last updated: {new Date().toLocaleDateString('en-IN')}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                © 2025 Plus Nine One Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}