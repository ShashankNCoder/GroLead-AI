import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { KanbanSquare } from "lucide-react";
import type { Lead } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/use-auth';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  status: string;
  icon: string;
}

const columns: KanbanColumn[] = [
  { id: "new", title: "New", color: "bg-blue-50", status: "new", icon: "🆕" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-50", status: "contacted", icon: "📞" },
  { id: "dropped", title: "Dropped", color: "bg-red-50", status: "dropped", icon: "❌" },
];

export default function KanbanBoard() {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: number; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Lead Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Update Lead Error:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    },
  });

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id.toString());
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedLead && draggedLead.status !== columnId) {
      updateLeadMutation.mutate({
        leadId: draggedLead.id,
        status: columnId,
      });
    }
    
    setDraggedLead(null);
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-slate-100 text-slate-700";
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-yellow-100 text-yellow-700";
    if (score >= 40) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div
      className="kanban-card p-2 sm:p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-move"
      draggable
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, lead)}
      onDragEnd={() => setDraggedLead(null)}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
        <div 
          className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md flex-shrink-0"
        >
          {getInitials(lead.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{lead.name}</p>
          <p className="text-xs text-slate-500 truncate">{lead.product}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {lead.status}
        </Badge>
        {lead.aiScore !== null && lead.aiScore > 0 && (
          <Badge className={`text-xs ${getScoreColor(lead.aiScore)}`}>
            {lead.aiScore}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg sm:text-xl">Lead Pipeline</CardTitle>
          <KanbanSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {columns.map((column) => {
            const columnLeads = getLeadsByStatus(column.status);
            const isDragOver = dragOverColumn === column.id;
            
            return (
              <div
                key={column.id}
                className={`kanban-column ${column.color} ${isDragOver ? 'drag-over' : ''} ${columnLeads.length === 0 ? 'min-h-[100px]' : ''} p-3 rounded-lg`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-base sm:text-lg">{column.icon}</span>
                    <h4 className="font-medium text-slate-700 text-sm sm:text-base">{column.title}</h4>
                  </div>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-xs">
                    {columnLeads.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  {columnLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  
                  {columnLeads.length === 0 && (
                    <div 
                      className="text-center text-slate-400 py-4 sm:py-8"
                    >
                      <p className="text-xs sm:text-sm font-medium">No leads in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
