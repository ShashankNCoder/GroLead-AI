import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import type { Lead } from "@shared/schema";

export default function HighPriorityLeads() {
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const highPriorityLeads = leads
    .filter(lead => (lead.aiScore || 0) >= 80)
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    .slice(0, 3);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-primary to-emerald-600",
      "from-accent to-blue-600", 
      "from-secondary to-yellow-600"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>High Priority Leads</CardTitle>
          <Badge variant="destructive" className="bg-red-100 text-red-700">
            Score &gt;80
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {highPriorityLeads.length > 0 ? (
            highPriorityLeads.map((lead, index) => (
              <div
                key={lead.id}
                className={`flex items-center justify-between p-3 bg-slate-50 rounded-lg ${
                  index === 0 ? 'animate-pulse-glow' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-sm text-slate-500">
                      {lead.product} - {lead.loanAmount || 'Amount not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-700">
                    {lead.aiScore}
                  </Badge>
                  <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-8">
              <p className="text-sm">No high priority leads yet</p>
              <p className="text-xs mt-1">Add leads and run AI scoring to see high-priority prospects</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
