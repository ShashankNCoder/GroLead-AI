import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, Target, TrendingUp, Clock, Users } from "lucide-react";

interface AnalyticsData {
  conversionRate: number;
  averageScore: number;
  revenue?: number;
}

export default function AIRecommendations() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  const recommendations = [
    {
      type: "timing",
      priority: "high",
      icon: Clock,
      title: "Optimize Contact Timing",
      description: "Your highest converting leads respond best between 6-8 PM. Consider scheduling more campaigns during this window.",
      impact: "Expected 15% increase in response rate",
      action: "Schedule evening campaigns",
      color: "green",
    },
    {
      type: "product",
      priority: "high",
      icon: Target,
      title: "Focus on Home Loans",
      description: "Home loan leads show 51% conversion rate - 2x higher than other products. Consider allocating more resources to this segment.",
      impact: "Potential 25% increase in overall conversions",
      action: "Increase home loan lead generation",
      color: "blue",
    },
    {
      type: "followup",
      priority: "medium",
      icon: TrendingUp,
      title: "Improve Follow-up Strategy",
      description: "Leads with scores 70-80 need 2-3 follow-ups for conversion. Automate follow-up sequences for Medium Priority leads.",
      impact: "Expected 20% increase in Medium Priority lead conversions",
      action: "Set up automated sequences",
      color: "yellow",
    },
    {
      type: "segmentation",
      priority: "medium",
      icon: Users,
      title: "Geographic Opportunity",
      description: "Delhi leads show higher engagement rates but lower conversion. Tailor messaging for regional preferences.",
      impact: "Potential 10% increase in Delhi conversions",
      action: "Create regional message templates",
      color: "purple",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high-priority":
        return "bg-red-100 text-red-700";
      case "medium-priority":
        return "bg-yellow-100 text-yellow-700";
      case "low-priority":
        return "bg-green-100 text-green-700";
      case "very-low-priority":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-500";
      case "blue":
        return "bg-blue-500";
      case "yellow":
        return "bg-yellow-500";
      case "purple":
        return "bg-purple-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg sm:text-xl">AI Recommendations</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          
          return (
            <div key={index} className="bg-white/60 backdrop-blur rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 ${getIconColor(rec.color)} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="font-medium text-slate-900 text-sm sm:text-base">{rec.title}</p>
                    <Badge className={`${getPriorityColor(rec.priority)} text-xs w-fit`}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-slate-600 mb-3">{rec.description}</p>
                  
                  <div className="bg-white/80 rounded-md p-2 sm:p-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                      <span className="text-slate-500">Expected Impact:</span>
                      <span className="font-medium text-green-600">{rec.impact}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                      <span className="text-slate-500">Recommended Action:</span>
                      <span className="font-medium text-slate-700">{rec.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      </CardContent>
    </Card>
  );
}
