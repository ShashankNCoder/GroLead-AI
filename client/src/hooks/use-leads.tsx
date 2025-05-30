import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Lead, InsertLead } from "@shared/schema";
import { supabase } from "@/lib/supabase";

export function useLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: leads = [],
    isLoading,
    error,
  } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData: InsertLead) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(leadData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Lead Created",
        description: "New lead has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead.",
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Lead> }) => {
      const { data: updatedLead, error } = await supabase
        .from("leads")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Lead Updated",
        description: "Lead has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Lead Deleted",
        description: "Lead has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead.",
        variant: "destructive",
      });
    },
  });

  const scoreLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data: lead, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;

      // Calculate score based on lead data
      const score = calculateLeadScore(lead);
      
      const { data: updatedLead, error: updateError } = await supabase
        .from("leads")
        .update({ aiScore: score })
        .eq("id", id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updatedLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Lead Scored",
        description: "Lead has been scored successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score lead.",
        variant: "destructive",
      });
    },
  });

  const batchScoreMutation = useMutation({
    mutationFn: async () => {
      const { data: leads, error: fetchError } = await supabase
        .from("leads")
        .select("*");
      
      if (fetchError) throw fetchError;

      const updates = leads.map(lead => ({
        id: lead.id,
        aiScore: calculateLeadScore(lead)
      }));

      const { error: updateError } = await supabase
        .from("leads")
        .upsert(updates);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Batch Scoring Complete",
        description: "All leads have been scored successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score leads.",
        variant: "destructive",
      });
    },
  });

  // Helper function to calculate lead score
  const calculateLeadScore = (lead: Lead) => {
    let score = 50; // Base score
    
    // Add points based on lead data
    if (lead.status === "converted") score += 20;
    if (lead.pastInteractions && lead.pastInteractions > 0) score += 10;
    if (lead.incomeLevel) score += 10;
    
    return Math.min(100, score); // Cap at 100
  };

  // Helper functions
  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getHighPriorityLeads = (threshold: number = 80) => {
    return leads
      .filter(lead => (lead.aiScore || 0) >= threshold)
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  };

  const getLeadsByProduct = (product: string) => {
    return leads.filter(lead => lead.product === product);
  };

  const getLeadsByCity = (city: string) => {
    return leads.filter(lead => lead.city === city);
  };

  const getLeadStats = () => {
    const total = leads.length;
    const converted = leads.filter(lead => lead.status === "converted").length;
    const contacted = leads.filter(lead => lead.status === "contacted").length;
    const newLeads = leads.filter(lead => lead.status === "new").length;
    const dropped = leads.filter(lead => lead.status === "dropped").length;
    
    const avgScore = total > 0 
      ? Math.round(leads.reduce((sum, lead) => sum + (lead.aiScore || 0), 0) / total)
      : 0;

    const conversionRate = total > 0 
      ? ((converted / total) * 100).toFixed(1)
      : "0.0";

    return {
      total,
      converted,
      contacted,
      newLeads,
      dropped,
      avgScore,
      conversionRate,
    };
  };

  return {
    // Data
    leads,
    isLoading,
    error,

    // Mutations
    createLead: createLeadMutation.mutate,
    updateLead: updateLeadMutation.mutate,
    deleteLead: deleteLeadMutation.mutate,
    scoreLead: scoreLeadMutation.mutate,
    batchScore: batchScoreMutation.mutate,

    // Mutation states
    isCreating: createLeadMutation.isPending,
    isUpdating: updateLeadMutation.isPending,
    isDeleting: deleteLeadMutation.isPending,
    isScoring: scoreLeadMutation.isPending,
    isBatchScoring: batchScoreMutation.isPending,

    // Helper functions
    getLeadsByStatus,
    getHighPriorityLeads,
    getLeadsByProduct,
    getLeadsByCity,
    getLeadStats,
  };
}

export function useLead(id: number) {
  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ["leads", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  return { lead, isLoading, error };
}
