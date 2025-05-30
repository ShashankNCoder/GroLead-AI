import { useState, useEffect } from "react";
import Navigation from "@/components/layout/navigation";
import StatsCards from "@/components/dashboard/stats-cards";
import KanbanBoard from "@/components/dashboard/kanban-board";
import UploadCSV from "@/components/add-leads/upload-csv";
import ManualEntry from "@/components/add-leads/manual-entry";
import LeadsTable from "@/components/score-leads/leads-table";
import LeadSelection from "@/components/engage-leads/lead-selection";
import MessageComposer from "@/components/engage-leads/message-composer";
import ChartsGrid from "@/components/reports/charts-grid";
import AIRecommendations from "@/components/reports/ai-recommendations";
import MessageTemplates from "@/components/settings/message-templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, Rocket, ArrowLeft, Users, TrendingUp} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";

// Auto-response suggestions type
interface AutoResponse {
  type: string;
  title: string;
  message: string;
  bgColor: string;
}

export default function Dashboard({ params }: { params: { tab?: string; subTab?: string } }) {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(() => params.tab || 'dashboard');
  const [addLeadsSubTab, setAddLeadsSubTab] = useState(() => params.subTab || '');
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const { user } = useUser();

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // First get the leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Then get the AI scoring results
      const { data: scoringData, error: scoringError } = await supabase
        .from('ai_scoring_results')
        .select('*')
        .eq('user_id', user.id);

      if (scoringError) throw scoringError;

      // Map the scoring results to leads
      return (leadsData ?? []).map((lead: any) => {
        const scoring = scoringData?.find(s => s.lead_id === lead.id);
        return {
          ...lead,
          aiScore: scoring?.score || 0
        };
      });
    },
    enabled: !!user
  });

  const stats = [
    {
      title: "Total Leads",
      value: leads.length || 0,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      description: "All leads in your pipeline"
    },
    {
      title: "High Priority Leads",
      value: leads.filter(lead => lead.aiScore >= 70).length || 0,
      icon: TrendingUp,
      gradient: "from-yellow-500 to-orange-600",
      description: "Score above 70"
    }
  ];

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setLocation('/dashboard');
    } else {
      const newPath = `/dashboard/${activeTab}${addLeadsSubTab ? `/${addLeadsSubTab}` : ''}`;
      setLocation(newPath);
    }
  }, [activeTab, addLeadsSubTab, setLocation]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setAddLeadsSubTab(''); // Reset subTab when changing main tab
  };

  // Handle subTab change
  const handleSubTabChange = (subTab: string) => {
    setAddLeadsSubTab(subTab);
  };

  // Auto-response suggestions
  const autoResponses: AutoResponse[] = [
    {
      type: "interested",
      title: "For Interested Leads",
      message: "Great! Let's schedule a call to discuss your requirements in detail.",
      bgColor: "bg-blue-50"
    },
    {
      type: "documents",
      title: "For Document Requests",
      message: "Please share your salary slips and bank statements.",
      bgColor: "bg-yellow-50"
    },
    {
      type: "pricing",
      title: "For Price Inquiries",
      message: "Our current rates start from 8.5% with flexible terms.",
      bgColor: "bg-green-50"
    }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLocation('/auth');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Top Scoring Leads - Full Width */}
            <StatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-primary hover:bg-slate-700 hover:text-white transition-all duration-200"
                    onClick={() => setActiveTab("add-leads")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Lead
                  </Button>
                  <Button 
                    className="w-full bg-accent hover:bg-slate-700 hover:text-white transition-all duration-200"
                    onClick={() => {
                      setActiveTab("add-leads");
                      setAddLeadsSubTab("upload");
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                  <Button 
                    className="w-full bg-yellow-500 hover:bg-slate-700 hover:text-white transition-all duration-200"
                    onClick={() => setActiveTab("engage-leads")}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Start Campaign
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="lg:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  {stats.map((stat) => (
                    <Card key={stat.title} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {stat.title}
                            </p>
                            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stat.description}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full bg-gradient-to-br ${stat.gradient}`}>
                            <stat.icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <KanbanBoard />
          </div>
        );

      case "add-leads":
        return (
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Add New Leads</h2>
                <p className="text-slate-600">Choose your preferred method to add leads to your pipeline</p>
              </div>
              {!addLeadsSubTab ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-32 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    onClick={() => handleSubTabChange("upload")}
                  >
                    <Upload className="h-8 w-8" />
                    <span>Upload CSV/Excel</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-32 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    onClick={() => handleSubTabChange("manual")}
                  >
                    <Plus className="h-8 w-8" />
                    <span>Manual Entry</span>
                  </Button>
                </div>
              ) : (
                <div>
                  <Button 
                    variant="ghost" 
                    className="mb-4 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => handleSubTabChange("")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Options
                  </Button>
                  {addLeadsSubTab === "upload" && <UploadCSV />}
                  {addLeadsSubTab === "manual" && <ManualEntry />}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "score-leads":
        return (
          <div className="space-y-6">
            <LeadsTable />
          </div>
        );

      case "engage-leads":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">WhatsApp Lead Engagement</h2>
              <p className="text-slate-600">Send personalized messages and track engagement</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <LeadSelection 
                  selectedLeads={selectedLeads}
                  onSelectionChange={setSelectedLeads}
                />
                <MessageComposer 
                  selectedLeads={selectedLeads}
                  onMessageSent={() => setSelectedLeads(new Set())}
                />
              </div>
              
              <div className="space-y-6">

                {/* Auto-Response Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-poppins text-lg">Auto-Response Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5 text-xs">
                      {autoResponses.map((response) => (
                        <div key={response.type} className={`p-2.5 ${response.bgColor} rounded-lg`}>
                          <p className="font-poppins font-medium text-slate-900 mb-0.5 text-sm">{response.title}:</p>
                          <p className="text-slate-600 font-light">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reports & Insights</h2>
              <p className="text-slate-600">Track performance and get AI-powered recommendations</p>
            </div>
            <ChartsGrid />
            <AIRecommendations />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Settings</h2>
              <p className="text-slate-600">Configure your GroLead AI preferences and integrations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MessageTemplates />
            </div>
          </div>
        );

      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-4">
      <div className="flex justify-end items-center px-4 pt-4">
        <button
          onClick={handleSignOut}
          className="text-sm text-blue-600 hover:underline bg-white border border-blue-100 rounded px-3 py-1 shadow-sm"
        >
          Sign Out
        </button>
      </div>
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24 md:pt-28">
        {renderTabContent()}
      </main>
    </div>
  );
}
