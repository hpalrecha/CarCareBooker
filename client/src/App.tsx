import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { applyClarityRouteGuard } from "@/lib/clarity";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import ContactFab from "@/components/contact-fab";

/**
 * Route-level code splitting.
 *
 * Every route used to be a static import, so ONE 791 KB chunk was downloaded, parsed and
 * executed before anything painted. A reader arriving on a blog article was paying for the
 * admin dashboard, the WhatsApp console, the Razorpay SDK and the booking modal — none of
 * which that page can use.
 *
 * Two routes stay eager, deliberately:
 *
 *   Home     — the most common entry point and the LCP page. Lazy-loading it would add a
 *              network round trip in front of the hero, trading a smaller bundle for a
 *              slower Largest Contentful Paint, which is the opposite of the goal.
 *   NotFound — tiny, and rendered synchronously by BlogPost for an unknown slug. Making it
 *              lazy would put a loading state in front of a 404.
 *
 * Everything else is split. The heavy commercial machinery (Razorpay, the booking modal)
 * is pulled in transitively by the service routes, so it now loads only when a customer is
 * actually on a page that can take a booking.
 */
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminWhatsApp = lazy(() => import("@/pages/admin-whatsapp"));
const ServiceLanding = lazy(() => import("@/pages/service-landing"));
const BookingConfirmation = lazy(() => import("@/pages/booking-confirmation"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsConditions = lazy(() => import("@/pages/terms-conditions"));
const RefundPolicy = lazy(() => import("@/pages/refund-policy"));
const Contact = lazy(() => import("@/pages/contact"));
const PpfCeramicLanding = lazy(() => import("@/pages/ppf-ceramic-landing"));
const Services = lazy(() => import("@/pages/services"));
const SeoServicePage = lazy(() => import("@/pages/seo-service-page"));
const BlogIndex = lazy(() => import("@/pages/blog-index"));
const BlogPost = lazy(() => import("@/pages/blog-post"));

/**
 * Placeholder shown while a route chunk downloads.
 *
 * Deliberately empty rather than a spinner. It occupies the full viewport in the page
 * background colour, so the swap to real content shifts nothing — a spinner that is
 * replaced by a header would be a layout shift, and CLS is one of the metrics this whole
 * change exists to improve. On a warm cache this is never visible.
 */
function RouteFallback() {
  return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/whatsapp" component={AdminWhatsApp} />
        <Route path="/services" component={Services} />
        <Route path="/services/:seoSlug" component={SeoServicePage} />
        <Route path="/blog" component={BlogIndex} />
        {/* Category listings share BlogIndex — same page, filtered. Declared BEFORE
            /blog/:slug so "category" is never mistaken for a post slug. */}
        <Route path="/blog/category/:categorySlug" component={BlogIndex} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/service/:slug" component={ServiceLanding} />
        <Route path="/booking-confirmation/:id" component={BookingConfirmation} />
        <Route path="/contact" component={Contact} />
        <Route path="/ppf-ceramic-coating" component={PpfCeramicLanding} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-conditions" component={TermsConditions} />
        <Route path="/refund-policy" component={RefundPolicy} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

/**
 * Stops Microsoft Clarity session recording while an admin screen is open.
 *
 * index.html already refuses to load the tag when the first page load is under /admin.
 * This covers the single-page case that guard cannot see: arriving on the public site
 * with recording active and then navigating to /admin/dashboard without a page load.
 * Admin screens show customer names, phone numbers, emails and payment status.
 */
function ClarityRouteGuard() {
  const [location] = useLocation();
  useEffect(() => {
    applyClarityRouteGuard(location);
  }, [location]);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <ClarityRouteGuard />
          <Toaster />
          <Router />
          {/* Rendered outside <Router> so it persists across every route rather than
              remounting on navigation. It hides itself on /admin. */}
          <ContactFab />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
