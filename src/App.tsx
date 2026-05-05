import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminCRM from "./components/jp/sections/AdminCRM";
import AdminCRMAdvanced from "./components/jp/sections/AdminCRMAdvanced";
import AdminMembers from "./components/jp/sections/AdminMembers";
import AdminAttendance from "./components/jp/sections/AdminAttendance";
import AdminPayments from "./components/jp/sections/AdminPayments";
import AdminAnalytics from "./components/jp/sections/AdminAnalytics";
import AdminSetup from "./components/jp/sections/AdminSetup";


// Admin route guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Check super admin email first
    const SUPER_ADMIN_EMAIL = "puspharaj.m2003@gmail.com";
    if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(true);
      setChecking(false);
      return;
    }
    // Otherwise check role in database
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === "admin");
        setChecking(false);
      });
  }, [user]);

  if (loading || checking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/404" element={<NotFound />} />
          <Route path="/admin" element={<AdminRoute><AdminCRM /></AdminRoute>} />
          <Route path="/admin/crm" element={<AdminRoute><AdminCRMAdvanced /></AdminRoute>} />
          <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
          <Route path="/admin/attendance" element={<AdminRoute><AdminAttendance /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="/admin/setup" element={<AdminRoute><AdminSetup /></AdminRoute>} />

          <Route path="/*" element={<Index />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
