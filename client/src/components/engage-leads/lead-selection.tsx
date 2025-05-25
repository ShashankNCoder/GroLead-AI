import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Lead } from "@shared/schema";

interface LeadSelectionProps {
  selectedLeads: Set<number>;
  onSelectionChange: (leadIds: Set<number>) => void;
}

export default function LeadSelection({ selectedLeads, onSelectionChange }: LeadSelectionProps) {
  const [selectAll, setSelectAll] = useState(false);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(new Set(leads.map(lead => lead.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleLeadToggle = (leadId: number, checked: boolean) => {
    const newSelection = new Set(selectedLeads);
    if (checked) {
      newSelection.add(leadId);
    } else {
      newSelection.delete(leadId);
    }
    onSelectionChange(newSelection);
    
    // Update select all state
    setSelectAll(newSelection.size === leads.length);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-orange-100 text-orange-700";
    if (score >= 40) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  const getWhatsAppStatusColor = (status: string) => {
    switch (status) {
      case "read":
      case "replied":
        return "bg-green-500";
      case "sent":
        return "bg-yellow-500";
      case "not_sent":
      default:
        return "bg-slate-400";
    }
  };

  const getWhatsAppStatusText = (status: string) => {
    switch (status) {
      case "read":
        return "Sent & Read";
      case "replied":
        return "Replied";
      case "sent":
        return "Sent";
      case "not_sent":
      default:
        return "Not Sent";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Leads to Engage</CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm text-slate-600">
              Select All
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox 
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Lead
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  WhatsApp Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500">Loading leads...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No leads available for engagement
                  </td>
                </tr>
              ) : (
                leads.map((lead, index) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={(checked) => handleLeadToggle(lead.id, checked as boolean)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                          {getInitials(lead.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-900">{lead.product}</span>
                      {lead.loanAmount && (
                        <p className="text-xs text-slate-500">{lead.loanAmount}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.aiScore > 0 ? (
                        <Badge className={`${getScoreColor(lead.aiScore)} text-xs`}>
                          {lead.aiScore}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Not scored</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 ${getWhatsAppStatusColor(lead.whatsappStatus)} rounded-full`} />
                        <span className="text-sm text-slate-600">
                          {getWhatsAppStatusText(lead.whatsappStatus)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
