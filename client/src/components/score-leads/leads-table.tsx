import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, MessageCircle, Edit, StickyNote, Download, Loader2, Users, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { useAuth } from '@/hooks/use-auth';

// Add these properties to the Lead type
interface ExtendedLead extends Lead {
  income: string | null;
  employment: string | null;
  contactMethod: string | null;
  pastInteractions: number | null;
  lastContacted: Date | null;
  suggestedActions?: string[];
  textMessagePoints?: {
    keyPoints: string[];
    tone: string;
    avoidMentioning: string[];
  };
  callTalkingPoints?: {
    opening: string;  
    keyTopics: string[];
    objectionHandling: string[];
    closing: string;
  };
}

// Add type for database updates
type LeadUpdate = {
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  product: string;
  income_level: string | null;
  employment: string | null;
  last_contacted: Date | null;
  contact_method: string | null;
  past_interactions: number | null;
  status: string | null;
  notes: string | null;
};

export default function LeadsTable() {
  const [cityFilter, setCityFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Separate state for each section
  const [scoringMarkedLeads, setScoringMarkedLeads] = useState<number[]>([]);
  const [availableMarkedLeads, setAvailableMarkedLeads] = useState<number[]>([]);
  const [scoringEditingLeadId, setScoringEditingLeadId] = useState<number | null>(null);
  const [availableEditingLeadId, setAvailableEditingLeadId] = useState<number | null>(null);
  const [scoringEditForm, setScoringEditForm] = useState<any>({});
  const [availableEditForm, setAvailableEditForm] = useState<any>({});

  const { data: leads = [], isLoading } = useQuery<ExtendedLead[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      try {
        // Fetch leads and scoring data in parallel
        const [leadsResponse, scoringResponse] = await Promise.all([
          supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('ai_scoring_results')
            .select('*')
            .eq('user_id', user.id)
        ]);

        if (leadsResponse.error) throw leadsResponse.error;
        if (scoringResponse.error) throw scoringResponse.error;

        // Create a map of scoring results for faster lookup
        const scoringMap = new Map(
          (scoringResponse.data || []).map(scoring => [scoring.lead_id, scoring])
        );

        // Map the leads with their scoring data
        return (leadsResponse.data || []).map((lead: any) => {
          const scoring = scoringMap.get(lead.id);
          return {
        ...lead,
        incomeLevel: lead.income_level,
        lastContacted: lead.last_contacted,
        contactMethod: lead.contact_method,
        pastInteractions: lead.past_interactions,
            aiScore: scoring?.score || 0,
            aiReason: scoring?.ai_reasoning || '',
            bestContactTime: scoring?.best_contact_time || '',
            suggestedActions: scoring?.suggested_actions || [],
            textMessagePoints: typeof scoring?.text_message_points === 'string'
              ? JSON.parse(scoring.text_message_points)
              : scoring?.text_message_points || null,
            callTalkingPoints: typeof scoring?.call_talking_points === 'string'
              ? JSON.parse(scoring.call_talking_points)
              : scoring?.call_talking_points || null,
          };
        });
      } catch (error) {
        console.error('Error fetching leads:', error);
        throw new Error('Failed to fetch leads. Please try again.');
      }
    },
    enabled: !!user,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2, // Retry failed requests twice
  });

  const batchScoreMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (availableMarkedLeads.length === 0) {
        throw new Error("Please select leads to score");
      }

      try {
      // Get the full lead objects for the marked leads
        const leadsToScore = leads.filter(lead => availableMarkedLeads.includes(lead.id));
        const unscoredLeads = leadsToScore.filter(lead => !lead.aiScore || lead.aiScore === 0);
        const alreadyScoredLeads = leadsToScore.filter(lead => lead.aiScore && lead.aiScore !== 0);

        if (unscoredLeads.length === 0) {
          toast({
            title: "Already Scored",
            description: "All selected leads are already scored.",
            variant: "default",
          });
          return { results: [], errors: [] };
        }

        if (alreadyScoredLeads.length > 0) {
          toast({
            title: "Some Leads Skipped",
            description: `${alreadyScoredLeads.length} lead(s) already scored and were skipped.`,
            variant: "default",
          });
        }

      const response = await fetch('/api/ai/score-leads-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, leads: unscoredLeads }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
        if (!data.success) {
        throw new Error(data.error || 'Failed to score leads');
      }

        // After successful scoring, update the AI scoring results in the database
        const validResults = (data.results || []).filter((result: any) => result.lead_id != null);
        if (validResults.length > 0) {
          const { error: upsertError } = await supabase
            .from('ai_scoring_results')
            .upsert(
              validResults.map((result: any) => ({
                user_id: user.id,
                lead_id: result.lead_id,
                lead_name: result.lead_name,
                product: result.product,
                score: result.score,
                ai_reasoning: result.ai_reasoning,
                best_contact_time: result.best_contact_time,
                suggested_actions: result.suggested_actions,
                text_message_points: result.text_message_points,
                call_talking_points: result.call_talking_points,
                created_at: new Date().toISOString()
              })),
              { onConflict: 'user_id,lead_id' }
            );

          if (upsertError) {
            console.error('Error updating AI scoring results:', upsertError);
            throw new Error(`Failed to update AI scoring results: ${upsertError.message}`);
          }
      }

      return data;
      } catch (error) {
        console.error('Error in batch scoring:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      const successCount = data.results?.length || 0;
      const errorCount = data.errors?.length || 0;
      
      if (errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `Successfully scored ${successCount} leads. ${errorCount} leads failed to score.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Batch Scoring Complete",
          description: `Successfully scored ${successCount} leads.`,
        });
      }
      
      setAvailableMarkedLeads([]);
    },
    onError: (error: any) => {
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score leads. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scoreLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      if (!user) throw new Error("User not authenticated");
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.aiScore && lead.aiScore !== 0) {
        toast({
          title: "Already Scored",
          description: "This lead is already scored.",
          variant: "default",
        });
        return null;
      }
      const { data, error } = await supabase
        .rpc('score_single_lead', { lead_id: leadId, user_id: user.id });

      if (error) throw error;

      // After successful scoring, update the AI scoring result in the database
      if (data && data.lead_id != null) {
        const { error: upsertError } = await supabase
          .from('ai_scoring_results')
          .upsert(
            [{
              user_id: user.id,
              lead_id: data.lead_id,
              lead_name: data.lead_name,
              product: data.product,
              score: data.score,
              ai_reasoning: data.ai_reasoning,
              best_contact_time: data.best_contact_time,
              suggested_actions: data.suggested_actions,
              text_message_points: data.text_message_points,
              call_talking_points: data.call_talking_points,
              created_at: new Date().toISOString()
            }],
            { onConflict: 'user_id,lead_id' }
          );
        if (upsertError) {
          throw new Error(`Failed to update AI scoring result: ${upsertError.message}`);
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Scored",
        description: "Lead has been scored successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Leads Deleted",
        description: "Selected leads have been deleted.",
      });
      setAvailableMarkedLeads([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete leads.",
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LeadUpdate }) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from('leads')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Updated",
        description: "Lead details have been updated.",
      });
      setAvailableEditingLeadId(null);
      setAvailableEditForm({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead.",
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
        case "High Priority": return score >= 80;
        case "Medium Priority": return score >= 60 && score < 80;
        case "Low Priority": return score >= 40 && score < 60;
        case "Very Low Priority": return score < 40;
        default: return true;
      }
    }
    return true;
  });

  // Pagination logic for all leads
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLeadsPerPageChange = (value: string) => {
    setLeadsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getScoreColor = (score: number, type?: string) => {
    if (type === "High Priority" || score >= 80) return "bg-red-100 text-red-700";
    if (type === "Medium Priority" || score >= 60) return "bg-orange-100 text-orange-700";
    if (type === "Low Priority" || score >= 40) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  const getScoreBarColor = (score: number, type?: string) => {
    if (type === "High Priority" || score >= 80) return "from-red-500 to-red-600";
    if (type === "Medium Priority" || score >= 60) return "from-orange-400 to-orange-500";
    if (type === "Low Priority" || score >= 40) return "from-blue-400 to-blue-500";
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
  const cities = Array.from(new Set(leads.map(lead => lead.city).filter((city): city is string => city !== null)));
  const products = Array.from(new Set(leads.map(lead => lead.product)));

  // Separate handlers for scoring section
  const handleScoringMarkAll = () => {
    const allVisibleMarked = currentLeads.every(lead => scoringMarkedLeads.includes(lead.id));
    if (allVisibleMarked) {
      setScoringMarkedLeads(scoringMarkedLeads.filter(id => !currentLeads.some(lead => lead.id === id)));
    } else {
      setScoringMarkedLeads([
        ...scoringMarkedLeads,
        ...currentLeads.filter(lead => !scoringMarkedLeads.includes(lead.id)).map(lead => lead.id)
      ]);
    }
  };

  const handleScoringMarkOne = (id: number) => {
    setScoringMarkedLeads(prev =>
      prev.includes(id)
        ? prev.filter(markedId => markedId !== id)
        : [...prev, id]
    );
  };

  const handleScoringEdit = (lead: ExtendedLead) => {
    setScoringEditingLeadId(lead.id);
    setScoringEditForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      pincode: lead.pincode,
      product: lead.product,
      incomeLevel: lead.incomeLevel,
      employment: lead.employment,
      lastContacted: lead.lastContacted ? new Date(lead.lastContacted).toISOString().slice(0, 10) : '',
      contactMethod: lead.contactMethod,
      pastInteractions: lead.pastInteractions,
      status: lead.status,
      notes: lead.notes,
    });
  };

  const handleScoringEditChange = (field: string, value: any) => {
    setScoringEditForm((prev: Record<string, any>) => ({ ...prev, [field]: value }));
  };

  const handleScoringEditSave = (id: number) => {
    updateLeadMutation.mutate({
      id,
      data: {
        name: scoringEditForm.name,
        phone: scoringEditForm.phone,
        email: scoringEditForm.email,
        address: scoringEditForm.address,
        city: scoringEditForm.city,
        state: scoringEditForm.state,
        pincode: scoringEditForm.pincode,
        product: scoringEditForm.product,
        income_level: scoringEditForm.incomeLevel,
        employment: scoringEditForm.employment,
        last_contacted: scoringEditForm.lastContacted ? new Date(scoringEditForm.lastContacted) : null,
        contact_method: scoringEditForm.contactMethod,
        past_interactions: scoringEditForm.pastInteractions,
        status: scoringEditForm.status,
        notes: scoringEditForm.notes,
      },
    });
  };

  const handleScoringEditCancel = () => {
    setScoringEditingLeadId(null);
    setScoringEditForm({});
  };

  // Separate handlers for available leads section
  const handleAvailableMarkAll = () => {
    const allVisibleMarked = currentLeads.every(lead => availableMarkedLeads.includes(lead.id));
    if (allVisibleMarked) {
      setAvailableMarkedLeads(availableMarkedLeads.filter(id => !currentLeads.some(lead => lead.id === id)));
    } else {
      setAvailableMarkedLeads([
        ...availableMarkedLeads,
        ...currentLeads.filter(lead => !availableMarkedLeads.includes(lead.id)).map(lead => lead.id)
      ]);
    }
  };

  const handleAvailableMarkOne = (id: number) => {
    setAvailableMarkedLeads(prev =>
      prev.includes(id)
        ? prev.filter(markedId => markedId !== id)
        : [...prev, id]
    );
  };

  const handleAvailableEdit = (lead: ExtendedLead) => {
    setAvailableEditingLeadId(lead.id);
    setAvailableEditForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      pincode: lead.pincode,
      product: lead.product,
      incomeLevel: lead.incomeLevel,
      employment: lead.employment,
      lastContacted: lead.lastContacted ? new Date(lead.lastContacted).toISOString().slice(0, 10) : '',
      contactMethod: lead.contactMethod,
      pastInteractions: lead.pastInteractions,
      status: lead.status,
      notes: lead.notes,
    });
  };

  const handleAvailableEditChange = (field: string, value: any) => {
    setAvailableEditForm((prev: Record<string, any>) => ({ ...prev, [field]: value }));
  };

  const handleAvailableEditSave = (id: number) => {
    updateLeadMutation.mutate({
      id,
      data: {
        name: availableEditForm.name,
        phone: availableEditForm.phone,
        email: availableEditForm.email,
        address: availableEditForm.address,
        city: availableEditForm.city,
        state: availableEditForm.state,
        pincode: availableEditForm.pincode,
        product: availableEditForm.product,
        income_level: availableEditForm.incomeLevel,
        employment: availableEditForm.employment,
        last_contacted: availableEditForm.lastContacted ? new Date(availableEditForm.lastContacted) : null,
        contact_method: availableEditForm.contactMethod,
        past_interactions: availableEditForm.pastInteractions,
        status: availableEditForm.status,
        notes: availableEditForm.notes,
      },
    });
  };

  const handleAvailableEditCancel = () => {
    setAvailableEditingLeadId(null);
    setAvailableEditForm({});
  };

  // Separate delete handlers
  const handleScoringDelete = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    if (scoringMarkedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to delete.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete AI scoring data for ${scoringMarkedLeads.length} selected lead(s)? This action cannot be undone.`)) {
      // Delete only the AI scoring data
      const { error } = await supabase
        .from('ai_scoring_results')
        .delete()
        .in('lead_id', scoringMarkedLeads)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete AI scoring data.",
          variant: "destructive",
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "AI Scoring Data Deleted",
        description: "Selected leads' AI scoring data has been deleted.",
      });
      setScoringMarkedLeads([]);
    }
  };

  const handleAvailableDelete = () => {
    if (availableMarkedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to delete.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${availableMarkedLeads.length} selected lead(s)? This action cannot be undone.`)) {
      deleteLeadsMutation.mutate(availableMarkedLeads);
      setAvailableMarkedLeads([]);
    }
  };

  // Separate export handlers
  const handleScoringExport = () => {
    if (scoringMarkedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to export.",
        variant: "destructive",
      });
      return;
    }

    const leadsToExport = leads
      .filter(lead => scoringMarkedLeads.includes(lead.id))
      .map(lead => ({
        name: lead.name,
        product: lead.product,
        score: lead.aiScore || 0,
        ai_reasoning: lead.aiReason || '',
        suggested_actions: lead.suggestedActions?.join(', ') || '',
        text_message_points: lead.textMessagePoints?.keyPoints?.join(', ') || '',
        call_talking_points: lead.callTalkingPoints?.keyTopics?.join(', ') || '',
        best_contact_time: lead.bestContactTime || ''
      }));

    const csv = Papa.unparse(leadsToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ai_scoring_export_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAvailableExport = () => {
    if (availableMarkedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to export.",
        variant: "destructive",
      });
      return;
    }

    const leadsToExport = leads.filter(lead => availableMarkedLeads.includes(lead.id));
    const csv = Papa.unparse(leadsToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `available_leads_export_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* AI Lead Scoring Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Lead Scoring</h2>
          <p className="text-slate-600">Analyze and rank your leads with intelligent AI scoring</p>
        </div>

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
                    {cities.filter(Boolean).map(city => (
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
                    {products.filter(Boolean).map(product => (
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
                    <SelectItem value="High Priority">80-100 (High Priority)</SelectItem>
                    <SelectItem value="Medium Priority">60-79 (Medium Priority)</SelectItem>
                    <SelectItem value="Low Priority">40-59 (Low Priority)</SelectItem>
                    <SelectItem value="Very Low Priority">0-39 (Very Low Priority)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleScoringExport} disabled={scoringMarkedLeads.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleScoringDelete}
                  disabled={scoringMarkedLeads.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-3 w-24 text-left border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={currentLeads.every(lead => scoringMarkedLeads.includes(lead.id))}
                      ref={el => {
                        if (el) el.indeterminate = !currentLeads.every(lead => scoringMarkedLeads.includes(lead.id)) && 
                          currentLeads.some(lead => scoringMarkedLeads.includes(lead.id));
                      }}
                      onChange={handleScoringMarkAll}
                      aria-label="Mark all leads"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Best Time to Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">AI Reasoning</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Suggested Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Text Message Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Call Talking Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-slate-500">Loading leads...</p>
                    </td>
                  </tr>
                ) : currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No leads found matching your filters
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((lead, index) => (
                    <tr key={lead.id} className="hover:bg-slate-50 animate-fade-in">
                      <td className="px-6 py-4 border-r border-slate-200">
                        {scoringEditingLeadId === lead.id ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="mr-2" onClick={() => handleScoringEditSave(lead.id)} disabled={updateLeadMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleScoringEditCancel}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={scoringMarkedLeads.includes(lead.id)}
                              onChange={() => handleScoringMarkOne(lead.id)}
                              aria-label={`Mark lead ${lead.name}`}
                              style={{ margin: 0 }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                            {getInitials(lead.name)}
                          </div>
                          <span className="font-medium text-slate-900">{lead.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-slate-200">
                        <span className="text-sm text-slate-900">{lead.product}</span>
                        {lead.loanAmount && (
                          <p className="text-xs text-slate-500">{lead.loanAmount}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-200">
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
                      <td className="px-6 py-4 border-r border-slate-200">
                        {lead.bestContactTime ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <p className="text-sm text-slate-600 truncate max-w-xs cursor-help">
                                {lead.bestContactTime}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <p className="text-sm">{lead.bestContactTime}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-slate-400">Not analyzed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-200">
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
                      <td className="px-6 py-4 border-r border-slate-200">
                        {lead.suggestedActions && lead.suggestedActions.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <p className="text-sm text-slate-600 truncate max-w-xs cursor-help">
                                {lead.suggestedActions.join(', ')}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <ul className="list-disc list-inside">
                                {lead.suggestedActions.map((action: string, index: number) => (
                                  <li key={index} className="text-sm">{action}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-slate-500 italic">No actions suggested</span>
                        )}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-200">
                        {lead.textMessagePoints && Array.isArray(lead.textMessagePoints.keyPoints) && lead.textMessagePoints.keyPoints.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <p className="text-sm text-slate-600 truncate max-w-xs cursor-help">
                                {lead.textMessagePoints.keyPoints.join(', ')}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <ul className="list-disc list-inside">
                                {lead.textMessagePoints.keyPoints.map((point: string, index: number) => (
                                  <li key={index} className="text-sm">{point}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-slate-500 italic">No text message points suggested</span>
                        )}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-200">
                        {lead.callTalkingPoints && Array.isArray(lead.callTalkingPoints.keyTopics) && lead.callTalkingPoints.keyTopics.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <p className="text-sm text-slate-600 truncate max-w-xs cursor-help">
                                {lead.callTalkingPoints.keyTopics.join(', ')}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <ul className="list-disc list-inside">
                                {lead.callTalkingPoints.keyTopics.map((point: string, index: number) => (
                                  <li key={index} className="text-sm">{point}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-slate-500 italic">No call talking points suggested</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Show</span>
                <Select value={leadsPerPage.toString()} onValueChange={handleLeadsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-600">leads per page</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Leads Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Available Leads</h2>
          <p className="text-slate-600">View and manage leads added through manual entry or CSV upload</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="text-sm whitespace-nowrap">
                  {filteredLeads.length} Total Leads
                </Badge>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => batchScoreMutation.mutate()}
                    disabled={batchScoreMutation.isPending || availableMarkedLeads.length === 0}
                    className="bg-primary hover:bg-gray-600 whitespace-nowrap"
                  >
                    {batchScoreMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scoring...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Add to Scoring
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="whitespace-nowrap" onClick={handleAvailableExport} disabled={availableMarkedLeads.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleAvailableDelete}
                    disabled={availableMarkedLeads.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-24 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">
                      <input
                        type="checkbox"
                        checked={currentLeads.every(lead => availableMarkedLeads.includes(lead.id))}
                        ref={el => {
                          if (el) el.indeterminate = !currentLeads.every(lead => availableMarkedLeads.includes(lead.id)) && 
                            currentLeads.some(lead => availableMarkedLeads.includes(lead.id));
                        }}
                        onChange={handleAvailableMarkAll}
                        aria-label="Mark all leads"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Lead Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Pincode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Income</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Employment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Last Contacted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Contact Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Past Interactions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={15} className="px-6 py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-slate-500">Loading leads...</p>
                      </td>
                    </tr>
                  ) : currentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-6 py-8 text-center text-slate-500">
                        No leads available
                      </td>
                    </tr>
                  ) : (
                    currentLeads.map((lead, index) => (
                      <tr key={lead.id} className="hover:bg-slate-50 animate-fade-in">
                        <td className="px-6 py-4 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <div className="flex items-center gap-2">
                              <Button size="sm" className="mr-2" onClick={() => handleAvailableEditSave(lead.id)} disabled={updateLeadMutation.isPending}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleAvailableEditCancel}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={availableMarkedLeads.includes(lead.id)}
                                onChange={() => handleAvailableMarkOne(lead.id)}
                                aria-label={`Mark lead ${lead.name}`}
                                style={{ margin: 0 }}
                              />
                              <button
                                type="button"
                                style={{ margin: 0, padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => handleAvailableEdit(lead)}
                                aria-label="Edit lead"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.name}
                              onChange={e => handleAvailableEditChange('name', e.target.value)}
                            />
                          ) : (
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                                {getInitials(lead.name)}
                              </div>
                              <span className="font-medium text-slate-900">{lead.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.phone}
                              onChange={e => handleAvailableEditChange('phone', e.target.value)}
                            />
                          ) : lead.phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.email}
                              onChange={e => handleAvailableEditChange('email', e.target.value)}
                            />
                          ) : (lead.email || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.address}
                              onChange={e => handleAvailableEditChange('address', e.target.value)}
                            />
                          ) : (lead.address || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.city}
                              onChange={e => handleAvailableEditChange('city', e.target.value)}
                            />
                          ) : (lead.city || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.state}
                              onChange={e => handleAvailableEditChange('state', e.target.value)}
                            />
                          ) : (lead.state || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.pincode}
                              onChange={e => handleAvailableEditChange('pincode', e.target.value)}
                            />
                          ) : (lead.pincode || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.product}
                              onChange={e => handleAvailableEditChange('product', e.target.value)}
                            />
                          ) : lead.product}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.incomeLevel}
                              onChange={e => handleAvailableEditChange('incomeLevel', e.target.value)}
                            />
                          ) : (lead.incomeLevel || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.employment}
                              onChange={e => handleAvailableEditChange('employment', e.target.value)}
                            />
                          ) : (lead.employment || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              type="date"
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.lastContacted}
                              onChange={e => handleAvailableEditChange('lastContacted', e.target.value)}
                            />
                          ) : (lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.contactMethod}
                              onChange={e => handleAvailableEditChange('contactMethod', e.target.value)}
                            />
                          ) : (lead.contactMethod || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              type="number"
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.pastInteractions}
                              onChange={e => handleAvailableEditChange('pastInteractions', e.target.value)}
                            />
                          ) : (lead.pastInteractions ?? '-')}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-200">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.status}
                              onChange={e => handleAvailableEditChange('status', e.target.value)}
                            />
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {lead.status || 'New'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {availableEditingLeadId === lead.id ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={availableEditForm.notes}
                              onChange={e => handleAvailableEditChange('notes', e.target.value)}
                            />
                          ) : (
                            <Tooltip>
                              <TooltipTrigger>
                                <p className="text-sm text-slate-600 truncate max-w-xs cursor-help">
                                  {lead.notes || '-'}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm">
                                <p className="text-sm">{lead.notes || 'No notes available'}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Show</span>
                  <Select value={leadsPerPage.toString()} onValueChange={handleLeadsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-slate-600">leads per page</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
