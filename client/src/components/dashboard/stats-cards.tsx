import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/use-user";

interface ScoredLead {
  id: number;
  name: string;
  aiScore: number;
  product: string;
  incomeLevel: string;
  bestContactTime: string;
  status: string;
}

interface Lead {
  id: number;
  name: string;
  product: string;
  income_level: string;
  status: string;
}

interface ScoringResult {
  lead_id: number;
  score: number;
  best_contact_time: string;
}

export default function StatsCards() {
  const { user } = useUser();
  
  const { data: scoredLeads, isLoading, error } = useQuery<ScoredLead[]>({
    queryKey: ["scored-leads"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      try {
        // Fetch leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        // Fetch scoring results
        const { data: scoringData, error: scoringError } = await supabase
          .from('ai_scoring_results')
          .select('*')
          .eq('user_id', user.id);

        if (scoringError) throw scoringError;

        // Create a map of scoring results for faster lookup
        const scoringMap = new Map(
          (scoringData as ScoringResult[] ?? []).map(result => [result.lead_id, result])
        );

        // Combine the data
        const leadsWithScores = (leadsData as Lead[] ?? [])
          .map((lead) => {
            const scoring = scoringMap.get(lead.id);
            return {
              id: lead.id,
              name: lead.name,
              aiScore: scoring?.score ?? 0,
              product: lead.product,
              incomeLevel: lead.income_level,
              bestContactTime: scoring?.best_contact_time ?? '',
              status: lead.status
            };
          })
          .filter(lead => lead.aiScore > 0) // Only include leads that have been scored
          .sort((a, b) => b.aiScore - a.aiScore)
          .slice(0, 3);

        return leadsWithScores;
      } catch (err) {
        console.error('Error fetching scored leads:', err);
        throw new Error(err instanceof Error ? err.message : 'Failed to fetch scored leads');
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000 // Consider data fresh for 30 seconds
  });

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-yellow-400 to-amber-500",
      "from-blue-400 to-indigo-500",
      "from-green-400 to-emerald-500"
    ];
    return gradients[index % gradients.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatContactTime = (time: string) => {
    if (!time) return "Time not set";
    
    try {
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">Top Scoring Leads</h3>
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            AI Score Ranking
          </Badge>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm font-medium">Loading leads...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-400">
              <p className="text-sm font-medium">Error loading leads</p>
              <p className="text-xs mt-1">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            </div>
          ) : scoredLeads && scoredLeads.length > 0 ? (
            scoredLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-slate-500">{lead.product}</p>
                      <span className="text-slate-300">•</span>
                      <p className="text-sm text-slate-500">{lead.incomeLevel}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-700">
                    Score: {lead.aiScore}
                  </Badge>
                  <Badge variant="outline" className="text-slate-600">
                    {formatContactTime(lead.bestContactTime)}
                  </Badge>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm font-medium">No leads scored yet</p>
              <p className="text-xs mt-1">Add leads and run AI scoring to see top performers</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
