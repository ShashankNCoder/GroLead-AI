import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  status: string;
}

const columns: KanbanColumn[] = [
  { id: "new", title: "New", color: "bg-slate-50", status: "new" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-50", status: "contacted" },
  { id: "converted", title: "Converted", color: "bg-green-50", status: "converted" },
  { id: "dropped", title: "Dropped", color: "bg-red-50", status: "dropped" },
];

export default function KanbanBoard() {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: number; status: string }) => {
      await apiRequest("PUT", `/api/leads/${leadId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Lead Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: () => {
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

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
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

  const getScoreColor = (score: number) => {
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
      className="kanban-card"
      draggable
      onDragStart={(e) => handleDragStart(e, lead)}
    >
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
          {getInitials(lead.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate">{lead.name}</p>
          <p className="text-xs text-slate-500 truncate">{lead.product}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {lead.status}
        </Badge>
        {lead.aiScore > 0 && (
          <Badge className={`text-xs ${getScoreColor(lead.aiScore)}`}>
            {lead.aiScore}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const columnLeads = getLeadsByStatus(column.status);
            const isDragOver = dragOverColumn === column.id;
            
            return (
              <div
                key={column.id}
                className={`kanban-column ${column.color} ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-700">{column.title}</h4>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                    {columnLeads.length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {columnLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  
                  {columnLeads.length === 0 && (
                    <div className="text-center text-slate-400 py-8">
                      <p className="text-sm">No leads in this stage</p>
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
