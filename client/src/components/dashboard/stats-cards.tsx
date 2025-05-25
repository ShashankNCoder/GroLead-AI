import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Star, IndianRupee } from "lucide-react";

export default function StatsCards() {
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
  });

  const stats = [
    {
      title: "Leads Today",
      value: analytics?.leadsToday || 0,
      change: "+12%",
      changeText: "from yesterday",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-accent",
    },
    {
      title: "Conversion Rate",
      value: `${analytics?.conversionRate || "0.0"}%`,
      change: "+3.1%",
      changeText: "this month",
      icon: TrendingUp,
      iconBg: "bg-green-100",
      iconColor: "text-primary",
    },
    {
      title: "Avg. Lead Score",
      value: analytics?.averageScore || 0,
      change: "+5 points",
      changeText: "improvement",
      icon: Star,
      iconBg: "bg-yellow-100",
      iconColor: "text-secondary",
    },
    {
      title: "Revenue This Month",
      value: "₹2.4L",
      change: "+28%",
      changeText: "vs last month",
      icon: IndianRupee,
      iconBg: "bg-green-100",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="animate-fade-in bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">{stat.title}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="text-white h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-semibold">{stat.change}</span>
                <span className="text-blue-600 ml-1">{stat.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
