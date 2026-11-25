import { useEffect } from "react";
import { Link } from "wouter";
import { BrandHeader, BrandFooter } from "@/components/redesign/brand-chrome";
import { Button } from "@/components/ui/button";
import { Compass, Home as HomeIcon, LifeBuoy } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found – P91 Car Care";
  }, []);

  return (
    <div className="p91-brand min-h-screen bg-black text-white flex flex-col">
      <BrandHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-xl w-full text-center">
          <p className="text-sm font-semibold tracking-widest text-[var(--neon-green)] mb-3">ERROR 404</p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">Page not found</h1>
          <p className="text-gray-300 text-lg mb-10">
            The page you were looking for doesn't exist, or it may have moved. Our services
            and booking pages are all still here.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[var(--neon-green)] hover:brightness-95 text-black font-bold"
                data-testid="button-404-home"
              >
                <HomeIcon className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
            {/* Was "/#services", a homepage anchor left over from before /services existed
                as its own indexed page (see services.tsx). */}
            <Link href="/services">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-[var(--neon-green)] text-[var(--neon-green)] hover:bg-[var(--neon-green)] hover:text-black font-bold"
                data-testid="button-404-services"
              >
                <Compass className="w-5 h-5 mr-2" />
                Browse Services
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-gray-400">
            Still stuck?{" "}
            <Link href="/contact">
              <span
                className="text-[var(--neon-green)] hover:brightness-95 underline cursor-pointer inline-flex items-center gap-1"
                data-testid="link-404-contact"
              >
                <LifeBuoy className="w-4 h-4" />
                Contact us
              </span>
            </Link>
          </p>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
