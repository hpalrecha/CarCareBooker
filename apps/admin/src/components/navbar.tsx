import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="w-10 h-10 bg-neon-green rounded-lg flex items-center justify-center">
              <span className="text-deep-black font-bold text-lg">P91</span>
            </div>
            <span className="text-xl font-bold gradient-text">Car Care</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <a href="#services" className="hover:text-neon-green transition-colors" data-testid="link-services">
              Services
            </a>
            <a href="#about" className="hover:text-neon-green transition-colors" data-testid="link-about">
              About
            </a>
            <a href="#contact" className="hover:text-neon-green transition-colors" data-testid="link-contact">
              Contact
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/admin/login" className="hidden md:block">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-neon-green"
                data-testid="button-admin-login"
              >
                Admin Login
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-neon-green"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-gray border-t border-medium-gray">
              <a
                href="#services"
                className="block px-3 py-2 text-base hover:text-neon-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
                data-testid="link-mobile-services"
              >
                Services
              </a>
              <a
                href="#about"
                className="block px-3 py-2 text-base hover:text-neon-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
                data-testid="link-mobile-about"
              >
                About
              </a>
              <a
                href="#contact"
                className="block px-3 py-2 text-base hover:text-neon-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
                data-testid="link-mobile-contact"
              >
                Contact
              </a>
              <Link href="/admin/login">
                <div
                  className="block px-3 py-2 text-base text-gray-400 hover:text-neon-green transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="link-mobile-admin"
                >
                  Admin Login
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
