"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ClientProfileHeader } from "@/components/profile/client/ClientProfileHeader";
import { ClientAbout } from "@/components/profile/client/ClientAbout";
import { ClientActiveProjects } from "@/components/profile/client/ClientActiveProjects";
import { clientService, ClientProfile, ClientStats } from "@/services/clientService";

const page = () => {
  const { clientId } = useParams(); // This is actually userId in the URL
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        
        // Fetch client profile and stats in parallel
        const [profileResponse, statsResponse] = await Promise.all([
          clientService.getClientProfile(clientId as string),
          clientService.getClientStats(clientId as string)
        ]);
        
        setClient(profileResponse.client);
        setStats(statsResponse.stats);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Failed to load client profile');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Client profile not found'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <ClientProfileHeader client={client} stats={stats || undefined} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ClientActiveProjects clientId={client.userId} />
          </div>
          <div className="space-y-8">
            <ClientAbout client={client} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default page;
