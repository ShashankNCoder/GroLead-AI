import { useState } from "react";
import Navigation from "@/components/layout/navigation";
import StatsCards from "@/components/dashboard/stats-cards";
import KanbanBoard from "@/components/dashboard/kanban-board";
import HighPriorityLeads from "@/components/dashboard/high-priority-leads";
import UploadCSV from "@/components/add-leads/upload-csv";
import ManualEntry from "@/components/add-leads/manual-entry";
import DocumentOCR from "@/components/add-leads/document-ocr";
import WebScraper from "@/components/add-leads/web-scraper";
import LeadsTable from "@/components/score-leads/leads-table";
import LeadSelection from "@/components/engage-leads/lead-selection";
import MessageComposer from "@/components/engage-leads/message-composer";
import ChartsGrid from "@/components/reports/charts-grid";
import AIRecommendations from "@/components/reports/ai-recommendations";
import MessageTemplates from "@/components/settings/message-templates";
import FieldCustomizer from "@/components/settings/field-customizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Rocket } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [addLeadsSubTab, setAddLeadsSubTab] = useState("upload");
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <StatsCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-primary hover:bg-emerald-600"
                    onClick={() => setActiveTab("add-leads")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Lead
                  </Button>
                  <Button 
                    className="w-full bg-accent hover:bg-blue-600"
                    onClick={() => {
                      setActiveTab("add-leads");
                      setAddLeadsSubTab("upload");
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                  <Button 
                    className="w-full bg-secondary hover:bg-yellow-500"
                    onClick={() => setActiveTab("engage-leads")}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Start Campaign
                  </Button>
                </CardContent>
              </Card>

              {/* High Priority Leads */}
              <div className="lg:col-span-2">
                <HighPriorityLeads />
              </div>
            </div>

            <KanbanBoard />
          </div>
        );

      case "add-leads":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Add New Leads</h2>
              <p className="text-slate-600">Choose your preferred method to add leads to your pipeline</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <Tabs value={addLeadsSubTab} onValueChange={setAddLeadsSubTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="upload">Upload CSV/Excel</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="ocr">Document OCR</TabsTrigger>
                    <TabsTrigger value="scraper">Web Scraper</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="mt-6">
                    <UploadCSV />
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-6">
                    <ManualEntry />
                  </TabsContent>
                  
                  <TabsContent value="ocr" className="mt-6">
                    <DocumentOCR />
                  </TabsContent>
                  
                  <TabsContent value="scraper" className="mt-6">
                    <WebScraper />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        );

      case "score-leads":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Lead Scoring</h2>
              <p className="text-slate-600">Analyze and rank your leads with intelligent AI scoring</p>
            </div>
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
                {/* Message Queue & Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Messages Sent</span>
                        <span className="font-semibold text-slate-900">24</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Read Rate</span>
                        <span className="font-semibold text-slate-900">78%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Response Rate</span>
                        <span className="font-semibold text-slate-900">23%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Conversion Rate</span>
                        <span className="font-semibold text-slate-900">12%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Auto-Response Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Response Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium text-slate-900 mb-1">For Interested Leads:</p>
                        <p className="text-slate-600">"Great! Let's schedule a call to discuss your requirements in detail."</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="font-medium text-slate-900 mb-1">For Document Requests:</p>
                        <p className="text-slate-600">"Please share your salary slips and bank statements."</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-slate-900 mb-1">For Price Inquiries:</p>
                        <p className="text-slate-600">"Our current rates start from 8.5% with flexible terms."</p>
                      </div>
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
              <FieldCustomizer />
            </div>
          </div>
        );

      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </main>
    </div>
  );
}
