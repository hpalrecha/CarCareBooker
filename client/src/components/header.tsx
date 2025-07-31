import { Link } from "wouter";
import logoPath from "@assets/Car Care (4)_1753951564515.png";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          <Link href="/">
            <div className="cursor-pointer">
              <img 
                src={logoPath} 
                alt="P91 Car Care" 
                className="h-10 w-auto"
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}