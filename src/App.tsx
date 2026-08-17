import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicHome from "./features/marketing/pages/PublicHome";
import Services from "./features/marketing/pages/Services";
import Portfolio from "./features/marketing/pages/Portfolio";
import About from "./features/marketing/pages/About";
import Contact from "./features/marketing/pages/Contact";
import NotFound from "./pages/NotFound";
import Auth from "./features/auth/pages/Auth";
import Platform from "./features/platform/pages/Platform";

// Lazy-loaded: the staff portal drags in its own TanStack Router, Recharts,
// and a full second shadcn/ui component set — none of that belongs in the
// initial bundle for marketing/builder visitors who never hit /staff/*.
const StaffPortal = lazy(() => import("./staff/StaffPortal"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          {/* Platform reads useLocation() itself to decide between its own
              dashboard shell and BuilderPage for /dashboard/chat,
              /dashboard/editor/:id, /dashboard/preview/:id, etc. */}
          <Route path="/dashboard/*" element={<Platform />} />

          {/* Staff/CRM portal — a separate TanStack Router app grafted on
              at /staff/*. See src/staff/StaffPortal.tsx. Lazy-loaded so its
              dependencies stay out of the main bundle. */}
          <Route
            path="/staff/*"
            element={
              <Suspense fallback={null}>
                <StaffPortal />
              </Suspense>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
