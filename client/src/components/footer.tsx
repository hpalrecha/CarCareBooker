import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  FOOTER_SERVICES,
  formatINR,
  resolveCanonical,
  type ServiceRecord,
} from "@/lib/canonical-services";
import { COMPANY_NAME, copyrightYear } from "@/lib/legal-metadata";

export default function Footer() {
  // Titles and prices come from the live active-service records, never from hardcoded
  // footer copy — that is how "Premium Car Wash - ₹599" (no such service, active or
  // inactive) and "Exterior Detailing - ₹1,999" (really ₹2,999) drifted out of sync.
  // resolveCanonical returns null unless the row is present in /api/services (active
  // only) with a matching id, slug and title, so a delisted service simply drops out
  // of the footer instead of becoming a dead link.
  const { data: services } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });
  const footerServices = FOOTER_SERVICES
    .map((entry) => resolveCanonical(services, entry))
    .filter((row): row is ServiceRecord => row !== null);

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
            <ul className="space-y-2 text-gray-400 text-sm" data-testid="list-footer-services">
              {footerServices.map((row) => (
                <li key={row.id}>
                  <Link href={`/service/${row.slug}`}>
                    <span
                      className="hover:text-neon-green transition-colors cursor-pointer"
                      data-testid={`link-footer-service-${row.slug}`}
                    >
                      {row.title.trim()} - {formatINR(row.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neon-green">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/contact">
                  <span className="hover:text-neon-green transition-colors cursor-pointer" data-testid="link-contact">
                    Contact Us
                  </span>
                </Link>
              </li>
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
              © {copyrightYear()} {COMPANY_NAME}. All rights reserved.
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