import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EmpirialIPhones from "./pages/EmpirialIPhones";
import EliteSneakers from "./pages/EliteSneakers";
import TradingEAStore from "./pages/TradingEAStore";
import Blog from "./pages/Blog";
import SEOAudit from "./pages/SEOAudit";
import TextEx from "./pages/TextEx";
import Auth from "./pages/Auth";
import ChatInterface from "./pages/ChatInterface";
import Preview from "./pages/Preview";
import RepoManagement from "./pages/RepoManagement";
import GenerateWebsite from "./pages/GenerateWebsite";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/repos" element={<RepoManagement />} />
          <Route path="/generate" element={<GenerateWebsite />} />
          <Route path="/preview/:repoId" element={<Preview />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/seo-audit" element={<SEOAudit />} />
          <Route path="/textex" element={<TextEx />} />
          <Route path="/empirial-iphones" element={<EmpirialIPhones />} />
          <Route path="/elite-sneakers" element={<EliteSneakers />} />
          <Route path="/trading-ea-store" element={<TradingEAStore />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;