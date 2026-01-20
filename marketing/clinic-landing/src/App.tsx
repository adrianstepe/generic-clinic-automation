import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import ClinicPage from "./pages/ClinicPage";
import NotFound from "./pages/NotFound";
import { clinics, getClinicBySlug, defaultClinic } from "./config/clinics";

const queryClient = new QueryClient();

// Dynamic clinic route component
const ClinicRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  const clinic = slug ? getClinicBySlug(slug) : undefined;

  if (!clinic) {
    // Show first clinic as fallback if slug not found
    return <ClinicPage clinic={clinics[0] || defaultClinic} />;
  }

  return <ClinicPage clinic={clinic} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Root redirects to first clinic */}
          <Route path="/" element={<Navigate to={`/${clinics[0]?.slug || 'demo'}`} replace />} />

          {/* Dynamic clinic routes */}
          <Route path="/:slug" element={<ClinicRoute />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
