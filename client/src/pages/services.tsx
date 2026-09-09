import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import ServiceCard from "@/components/service-card";
import ServiceFilter from "@/components/service-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { type ServiceRecord } from "@/lib/canonical-services";

/**
 * The service catalogue as its own page.
 *
 * Audit finding UX-1, second half: the nav's "Services" link was only an anchor to a grid
 * on the homepage (`#services`), so there was no real page to bookmark, share, or rank in
 * Google for "car detailing services bangalore" — the homepage had to compete for every
 * service query at once.
 *
 * This is ADDITIVE and deliberately so. `/service/:slug` — the 17 indexed per-service
 * pages — is untouched, and this route does not replace or redirect any of them. The
 * redesign prototype used `/services/<marketing-slug>` for four hand-written pages;
 * adopting that scheme would have orphaned the existing indexed URLs, so it was not
 * adopted. This page links to the real `/service/:slug` records.
 *
 * Everything on it comes from GET /api/services — the same query the homepage uses, so
 * react-query serves it from cache when arriving from the homepage.
 */
export default function Services() {
  const { data: services, isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });

  useSeoMeta({
    title: "All Car Detailing Services in Bangalore | P91 Car Care",
    description:
      "Browse every P91 Car Care service: ceramic coating, paint protection film, interior " +
      "and exterior detailing, glass and sun-control film, headlight restoration and the " +
      "annual maintenance package. Filter by vehicle and book online.",
    image: "/Car Care (4)_1753951564515.png",
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="pt-28 pb-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">All </span>
              <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Services
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              Filter by what your vehicle is and what it needs. Prices, offers and availability are
              live — the same ones you will see at checkout.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-48 bg-gray-800" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-32 bg-gray-800" />
                    <Skeleton className="h-16 w-full bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ServiceFilter services={Array.isArray(services) ? services : []}>
              {(filtered) => (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filtered.map((service: any) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </ServiceFilter>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
