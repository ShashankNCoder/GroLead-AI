import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, PieChart, TrendingUp, Map, Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line } from "recharts";

export default function ChartsGrid() {
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
  });

  // Mock data for demonstration - in real app this would come from analytics API
  const leadsConversionData = [
    { week: "Week 1", added: 45, converted: 8 },
    { week: "Week 2", added: 52, converted: 12 },
    { week: "Week 3", added: 38, converted: 9 },
    { week: "Week 4", added: 61, converted: 15 },
  ];

  const leadSourceData = [
    { name: "Manual Entry", value: 45, color: "#10B981" },
    { name: "CSV Upload", value: 35, color: "#F59E0B" },
    { name: "Web Scraper", value: 20, color: "#3B82F6" },
  ];

  const scoreConversionData = [
    { scoreRange: "80-100", conversionRate: 65 },
    { scoreRange: "60-79", conversionRate: 32 },
    { scoreRange: "40-59", conversionRate: 18 },
    { scoreRange: "0-39", conversionRate: 8 },
  ];

  const topProductsData = [
    { product: "Home Loan", leads: 45, conversions: 23, rate: 51.1 },
    { product: "Personal Loan", leads: 38, conversions: 12, rate: 31.6 },
    { product: "Car Loan", leads: 32, conversions: 8, rate: 25.0 },
    { product: "Credit Card", leads: 28, conversions: 6, rate: 21.4 },
    { product: "Business Loan", leads: 15, conversions: 2, rate: 13.3 },
  ];

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
              <Button variant="outline" className="text-accent hover:text-blue-600">
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button className="bg-primary hover:bg-emerald-600">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Added vs Converted */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Leads Added vs Converted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leadsConversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="added" fill="#10B981" name="Added" />
                <Bar dataKey="converted" fill="#3B82F6" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Source Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-secondary" />
              Lead Source Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Tooltip />
                <RechartsPieChart data={leadSourceData}>
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {leadSourceData.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm text-slate-600">{source.name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{source.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score vs Conversion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-accent" />
              Score vs Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={scoreConversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scoreRange" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
                <Line 
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Density Heatmap Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Map className="mr-2 h-5 w-5 text-destructive" />
              Lead Density by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Map className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-slate-600 text-sm">Interactive Map View</p>
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  <div>Delhi: {analytics?.leadsByProduct?.["Home Loan"] || 45} leads</div>
                  <div>Mumbai: 32 leads</div>
                  <div>Bangalore: 28 leads</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProductsData.map((product, index) => (
              <div
                key={product.product}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0 ? 'bg-gradient-to-r from-primary/5 to-primary/10' :
                  index === 1 ? 'bg-gradient-to-r from-secondary/5 to-secondary/10' :
                  index === 2 ? 'bg-gradient-to-r from-accent/5 to-accent/10' :
                  'bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-primary text-white' :
                    index === 1 ? 'bg-secondary text-white' :
                    index === 2 ? 'bg-accent text-white' :
                    'bg-slate-400 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{product.product}</p>
                    <p className="text-sm text-slate-500">
                      {product.leads} leads • {product.conversions} conversions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    index === 0 ? 'text-primary' :
                    index === 1 ? 'text-secondary' :
                    index === 2 ? 'text-accent' :
                    'text-slate-600'
                  }`}>
                    {product.rate}%
                  </p>
                  <p className="text-xs text-slate-500">conversion rate</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
