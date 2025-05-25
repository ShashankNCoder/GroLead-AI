import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, Target, TrendingUp, Clock, Users } from "lucide-react";

export default function AIRecommendations() {
  const { data: analytics } = useQuery({
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
      description: "Leads with scores 70-80 need 2-3 follow-ups for conversion. Automate follow-up sequences for warm leads.",
      impact: "Expected 20% increase in warm lead conversions",
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
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
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
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <CardTitle>AI Recommendations</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          
          return (
            <div key={index} className="bg-white/60 backdrop-blur rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 ${getIconColor(rec.color)} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900 mb-1">{rec.title}</p>
                      <Badge className={`${getPriorityColor(rec.priority)} text-xs`}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3">{rec.description}</p>
                  
                  <div className="bg-white/80 rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Expected Impact:</span>
                      <span className="font-medium text-green-600">{rec.impact}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Recommended Action:</span>
                      <span className="font-medium text-slate-700">{rec.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Insights Summary */}
        <div className="bg-white/60 backdrop-blur rounded-lg p-4 border-2 border-indigo-200/50">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
            <h4 className="font-medium text-slate-900">Key Insights</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {analytics?.conversionRate || "18.2"}%
              </div>
              <div className="text-xs text-slate-500">Overall Conversion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹2.4L</div>
              <div className="text-xs text-slate-500">Monthly Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.averageScore || 76}
              </div>
              <div className="text-xs text-slate-500">Average Lead Score</div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg p-4 text-white">
          <h4 className="font-medium mb-2">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-2 transition-colors">
              Schedule Evening Campaign
            </button>
            <button className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-2 transition-colors">
              Create Follow-up Sequence
            </button>
            <button className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-2 transition-colors">
              Export High-Score Leads
            </button>
            <button className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-2 transition-colors">
              View Regional Analytics
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
