import { useState, useEffect } from "react";
import { Brain, ChartLine, Plus, Star, MessageCircle, BarChart3, Settings, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: ChartLine },
  { id: "add-leads", label: "Add Leads", icon: Plus },
  { id: "score-leads", label: "Score Leads", icon: Star },
  { id: "engage-leads", label: "Engage", icon: MessageCircle },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export default function Navigation({ 
  activeTab, 
  onTabChange,
  gradientFrom = "from-blue-50",
  gradientVia = "via-white",
  gradientTo = "to-indigo-50"
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      setMobileMenuOpen(false);
      localStorage.clear();
      sessionStorage.clear();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      setTimeout(() => {
        setLocation('/auth');
      }, 100);
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast({
        title: "Error logging out",
        description: error.message || "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    }
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const NavContent = () => (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ghost"
              className={`nav-tab ${isActive ? 'active' : ''} justify-start w-full md:w-auto text-slate-900`}
              onClick={() => handleTabClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
              <span className="sm:inline">{item.label}</span>
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  layoutId="activeTab"
                  aria-hidden="true"
                />
              )}
            </Button>
          </motion.div>
        );
      })}
    </>
  );

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-lg' 
          : `bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo}`
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain className="h-5 w-5 md:h-6 md:w-6 text-white" aria-hidden="true" />
            </motion.div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                GroLead AI
              </h1>
              <p className="text-xs md:text-sm text-blue-600 font-medium">
                Turn Every Lead Into Gold
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-1" aria-label="Main navigation">
              <NavContent />
            </nav>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className="text-slate-900 hover:text-blue-600 hover:bg-blue-50"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Logout"
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2" aria-hidden="true" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Logout</span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden hover:bg-blue-200 hover:text-blue-600"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] sm:w-[350px] p-0 bg-white"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center space-x-2 p-6 border-b">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <span className="font-semibold text-lg text-slate-900">GroLead AI</span>
              </div>
              <nav className="flex flex-col p-4 space-y-2">
                <NavContent />
                <div className="pt-4 mt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-900 hover:text-blue-600 hover:bg-blue-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    aria-label="Logout"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2" aria-hidden="true" />
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Logout</span>
                      </>
                    )}
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
