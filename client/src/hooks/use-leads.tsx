import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead, InsertLead } from "@shared/schema";

export function useLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: leads = [],
    isLoading,
    error,
  } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData: InsertLead) => {
      await apiRequest("POST", "/api/leads", leadData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
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
      await apiRequest("PUT", `/api/leads/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
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
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
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
      await apiRequest("POST", `/api/leads/${id}/score`);
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
        description: error.message || "Failed to score lead.",
        variant: "destructive",
      });
    },
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
    onError: (error: any) => {
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score leads.",
        variant: "destructive",
      });
    },
  });

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
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  return leads.find(lead => lead.id === id);
}
