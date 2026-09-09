import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { applyClarityRouteGuard } from "@/lib/clarity";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminWhatsApp from "@/pages/admin-whatsapp";
import ServiceLanding from "@/pages/service-landing";
import BookingConfirmation from "@/pages/booking-confirmation";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsConditions from "@/pages/terms-conditions";
import RefundPolicy from "@/pages/refund-policy";
import Contact from "@/pages/contact";
import PpfCeramicLanding from "@/pages/ppf-ceramic-landing";
import Services from "@/pages/services";
import SeoServicePage from "@/pages/seo-service-page";
import BlogIndex from "@/pages/blog-index";
import BlogPost from "@/pages/blog-post";
import ContactFab from "@/components/contact-fab";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/whatsapp" component={AdminWhatsApp} />
      <Route path="/services" component={Services} />
      <Route path="/services/:seoSlug" component={SeoServicePage} />
      <Route path="/blog" component={BlogIndex} />
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
