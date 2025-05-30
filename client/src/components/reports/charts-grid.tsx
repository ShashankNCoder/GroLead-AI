import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, PieChart, TrendingUp, Map, Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Pie } from "recharts";
import { useAuth } from '@/hooks/use-auth';

interface LeadsConversion {
  week: string;
  added: number;
  converted: number;
}

interface LeadSource {
  name: string;
  value: number;
  color?: string;
}

interface TopProduct {
  product: string;
  leads: number;
  conversions: number;
  rate: number;
}

interface AnalyticsData {
  leadsByProduct?: {
    [key: string]: number;
  };
  leadsConversionData?: LeadsConversion[];
  leadSourceData?: LeadSource[];
  topProductsData?: TopProduct[];
  aiScoredLeads?: {
    week: string;
    total: number;
    highPriority: number;
  }[];
}

export default function ChartsGrid() {
  const { user } = useAuth();
  
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const response = await fetch(`/api/analytics?user_id=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!user
  });

  // Fallbacks for empty data
  const leadsConversionData: LeadsConversion[] = analytics?.leadsConversionData || [];
  const leadSourceData: LeadSource[] = analytics?.leadSourceData || [];
  const topProductsData: TopProduct[] = analytics?.topProductsData || [];
  const leadsByProduct = analytics?.leadsByProduct || {};
  const aiScoredLeads = analytics?.aiScoredLeads || [];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-slate-700">Date Range:</label>
              <Select defaultValue="7days">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="text-accent hover:text-white hover:bg-blue-600">
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button className="bg-primary hover:bg-slate-700 hover:text-white">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Leads scored */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              AI Leads scored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={aiScoredLeads}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#10B981" name="Total Scored" />
                <Bar dataKey="highPriority" fill="#3B82F6" name="High Priority" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="text-sm text-slate-600">Total Scored</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                <span className="text-sm text-slate-600">High Priority</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Source Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-red-500" />
              Lead Source Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={leadSourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {leadSourceData.map((entry: LeadSource, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#ccc"} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {leadSourceData.map((source: LeadSource, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color || "#ccc" }}
                    />
                    <span className="text-sm text-slate-600">{source.name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{source.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        
      </div>

    </div>
  );
}
