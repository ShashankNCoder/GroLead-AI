import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Create a new QueryClient instance
const queryClient = new QueryClient();

function Router() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user && !location.startsWith("/auth")) {
        setLocation("/auth");
      } else if (session?.user && location === "/auth") {
        setLocation("/dashboard");
      }
    });
    // Initial check
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session?.user && !location.startsWith("/auth")) {
        setLocation("/auth");
      } else if (data.session?.user && location === "/auth") {
        setLocation("/dashboard");
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [location, setLocation]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user && !location.startsWith("/auth")) {
    setLocation("/auth");
    return null;
  }

  if (user && location === "/auth") {
    setLocation("/dashboard");
    return null;
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard/:tab?/:subTab?" component={Dashboard} />
      <Route path="/" component={() => {
        setLocation("/dashboard");
        return null;
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
