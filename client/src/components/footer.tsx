import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-deep-black border-t border-medium-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/Car Care (4)_1753951564515.png" 
                alt="P91 Car Care" 
                className="h-8 w-auto"
                data-testid="img-logo-footer"
              />
              <span className="text-xl font-semibold gradient-text">P91 Car Care</span>
            </div>
            <div className="text-gray-400 text-sm space-y-1">
              <p><strong className="text-white">Plus Nine One Inc</strong></p>
              <p>GST: 29AMIPP3288M1Z6</p>
              <p>Professional car detailing services in Bangalore</p>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neon-green">Our Services</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Premium Car Wash - ₹599</li>
              <li>Interior Detailing - ₹2,499</li>
              <li>Exterior Detailing - ₹1,999</li>
              <li>Windshield Glass Coating - ₹1,399</li>
              <li>Headlight Restoration - ₹1,199</li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neon-green">Legal</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/terms-conditions">
                  <span className="hover:text-neon-green transition-colors cursor-pointer" data-testid="link-terms">
                    Terms & Conditions
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <span className="hover:text-neon-green transition-colors cursor-pointer" data-testid="link-privacy">
                    Privacy Policy
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/refund-policy">
                  <span className="hover:text-neon-green transition-colors cursor-pointer" data-testid="link-refund">
                    Refund & Cancellation Policy
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neon-green">Payment & Security</h3>
            <div className="text-gray-400 text-sm space-y-2">
              <p>Secure payments via Razorpay</p>
              <p>All prices in INR (₹)</p>
              <p>SSL encrypted transactions</p>
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  Refunds processed within 5-7 working days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-medium-gray">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Plus Nine One Inc. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-4 md:mt-0">
              Made with ❤️ for car enthusiasts in Bangalore
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}