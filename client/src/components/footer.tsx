import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import logoPath from "@assets/Car Care (4)_1753951564515.png";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <img 
                src={logoPath} 
                alt="P91 Car Care" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Bangalore's premier car detailing center offering professional services 
              with guaranteed satisfaction. Transform your car with our expert technicians.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Bangalore, Karnataka</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">+91 9876543210</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">info@p91carcare.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Mon-Sun: 9:00 AM - 8:00 PM</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li><Link href="/service/interior-deep-clean" className="text-gray-300 hover:text-green-400 transition-colors">Interior Deep Clean</Link></li>
              <li><Link href="/service/glass-coating" className="text-gray-300 hover:text-green-400 transition-colors">Glass Coating</Link></li>
              <li><Link href="/service/headlight-restoration" className="text-gray-300 hover:text-green-400 transition-colors">Headlight Restoration</Link></li>
              <li><Link href="/service/premium-wash-detail" className="text-gray-300 hover:text-green-400 transition-colors">Premium Detail</Link></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal & Policies</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className="text-gray-300 hover:text-green-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-gray-300 hover:text-green-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="text-gray-300 hover:text-green-400 transition-colors">Refund Policy</Link></li>
              <li><Link href="/cancellation-policy" className="text-gray-300 hover:text-green-400 transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 P91 Car Care. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4 md:mt-0 text-sm">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-green-400 transition-colors">Privacy</Link>
              <span className="text-gray-600">|</span>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-green-400 transition-colors">Terms</Link>
              <span className="text-gray-600">|</span>
              <Link href="/refund-policy" className="text-gray-400 hover:text-green-400 transition-colors">Refunds</Link>
              <span className="text-gray-600">|</span>
              <Link href="/cancellation-policy" className="text-gray-400 hover:text-green-400 transition-colors">Cancellation</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}