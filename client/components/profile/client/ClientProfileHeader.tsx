
"use client";

import { useAuth } from "@/stores/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, DollarSign, Star, CheckCircle, Edit, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClientProfile, ClientStats } from "@/services/clientService";

interface ClientProfileHeaderProps {
  client: ClientProfile;
  stats?: ClientStats;
}

export const ClientProfileHeader = ({ client, stats }: ClientProfileHeaderProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const isOwnProfile = user?.id === client.userId;

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 bg-gradient-to-r from-primary/10 to-primary/5">
        {/* Cover Image */}
        <img
          src="/placeholder.svg"
          alt="Cover image"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <CardContent className="p-6 pt-0">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-end -mt-16 sm:space-x-6">
          <Avatar className="h-32 w-32 border-4 border-background bg-background shadow-md">
            <AvatarImage src={user?.avatar} alt={client.fullName} />
            <AvatarFallback>{client.fullName[0]}</AvatarFallback>
          </Avatar>
          <div className="mt-4 sm:mt-0 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-end">
            <div>
              <h1 className="text-3xl font-bold">{client.fullName}</h1>
              <p className="text-muted-foreground">{client.companyName || "Company not specified"}</p>
              <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{client.location || "Location not specified"}</span>
              </div>
            </div>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 sm:mt-0"
                onClick={() => router.push("/account/settings")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats?.totalJobs || 0}</p>
            <p className="text-sm text-muted-foreground">Jobs Posted</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">${stats?.totalSpent ? (stats.totalSpent / 1000).toFixed(1) + 'k' : '0'}</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

