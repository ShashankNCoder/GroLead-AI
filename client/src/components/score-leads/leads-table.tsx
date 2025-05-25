import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, MessageCircle, Edit, StickyNote, Download, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

export default function LeadsTable() {
  const [cityFilter, setCityFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const batchScoreMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/leads/score-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Batch Scoring Complete",
        description: "All leads have been scored successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Scoring Failed",
        description: "Failed to score leads. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scoreLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      await apiRequest("POST", `/api/leads/${leadId}/score`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Scored",
        description: "Lead has been scored successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Scoring Failed",
        description: "Failed to score lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter(lead => {
    if (cityFilter !== "all" && lead.city !== cityFilter) return false;
    if (productFilter !== "all" && lead.product !== productFilter) return false;
    if (scoreFilter !== "all") {
      const score = lead.aiScore || 0;
      switch (scoreFilter) {
        case "hot": return score >= 80;
        case "warm": return score >= 60 && score < 80;
        case "cold": return score >= 40 && score < 60;
        case "low": return score < 40;
        default: return true;
      }
    }
    return true;
  });

  const getScoreColor = (score: number, type?: string) => {
    if (type === "hot" || score >= 80) return "bg-red-100 text-red-700";
    if (type === "warm" || score >= 60) return "bg-orange-100 text-orange-700";
    if (type === "cold" || score >= 40) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  const getScoreBarColor = (score: number, type?: string) => {
    if (type === "hot" || score >= 80) return "from-red-500 to-red-600";
    if (type === "warm" || score >= 60) return "from-orange-400 to-orange-500";
    if (type === "cold" || score >= 40) return "from-blue-400 to-blue-500";
    return "from-slate-400 to-slate-500";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-primary to-emerald-600",
      "from-accent to-blue-600",
      "from-secondary to-yellow-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
    ];
    return gradients[index % gradients.length];
  };

  // Get unique values for filters
  const cities = Array.from(new Set(leads.map(lead => lead.city).filter(Boolean)));
  const products = Array.from(new Set(leads.map(lead => lead.product)));

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Scores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="hot">80-100 (Hot)</SelectItem>
                  <SelectItem value="warm">60-79 (Warm)</SelectItem>
                  <SelectItem value="cold">40-59 (Cold)</SelectItem>
                  <SelectItem value="low">0-39 (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => batchScoreMutation.mutate()}
                disabled={batchScoreMutation.isPending}
                className="bg-primary hover:bg-emerald-600"
              >
                {batchScoreMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Batch Score All
                  </>
                )}
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  AI Reasoning
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Best Contact Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500">Loading leads...</p>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No leads found matching your filters
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, index) => (
                  <tr key={lead.id} className="hover:bg-slate-50 animate-fade-in">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                          {getInitials(lead.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.name}</p>
                          <p className="text-sm text-slate-500">{lead.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">{lead.product}</span>
                      {lead.loanAmount && (
                        <p className="text-xs text-slate-500">{lead.loanAmount}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${getScoreBarColor(lead.aiScore || 0, lead.aiType || undefined)} rounded-full transition-all duration-500`}
                            style={{ width: `${lead.aiScore || 0}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">
                          {lead.aiScore || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.aiType ? (
                        <Badge className={`${getScoreColor(lead.aiScore || 0, lead.aiType)} capitalize`}>
                          {lead.aiType}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scoreLeadMutation.mutate(lead.id)}
                          disabled={scoreLeadMutation.isPending}
                        >
                          {scoreLeadMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Brain className="mr-1 h-3 w-3" />
                              Score
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.aiReason ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <p className="text-sm text-slate-600 truncate max-w-xs cursor-help">
                              {lead.aiReason}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm">
                            <p className="text-sm">{lead.aiReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-slate-400">Not analyzed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">
                        {lead.bestContactTime || "Not specified"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-accent hover:text-blue-700">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-secondary hover:text-yellow-600">
                          <StickyNote className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
