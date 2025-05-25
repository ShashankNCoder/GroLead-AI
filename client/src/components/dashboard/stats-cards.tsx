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
          <Card key={index} className="animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.iconColor} h-6 w-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-primary font-medium">{stat.change}</span>
                <span className="text-slate-500 ml-1">{stat.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
