import { Briefcase, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useAuth } from "@/stores/useAuth";
import { clientService, ClientStats } from "@/services/clientService";

export function DashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const response = await clientService.getClientStats(user.id);
        setStats(response.stats);
      } catch (error) {
        console.error("Error fetching client stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const displayStats = [
    {
      name: "Total Jobs Posted",
      value: stats?.totalJobs ?? 0,
      icon: Briefcase,
    },
    {
      name: "Total Spent",
      value: `$${(stats?.totalSpent ?? 0).toLocaleString()}`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((stat) => (
        <Card key={stat.name} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-md" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                )}
              </div>
              <stat.icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
