"use client";

import Guard from "@/components/Guard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/Client/Stats";
import { ProjectsSummary } from "@/components/dashboard/Client/ProjectsSummary";
import { RecentActivity } from "@/components/dashboard/Client/RecentActivity";

const page = () => {
  return (
    <Guard>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Welcome back, here's what's happening with your projects.</p>
          </div>

          {/* Stats Overview */}
          <DashboardStats />

          {/* Main Content Grid */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProjectsSummary />
            </div>
            <div className="space-y-6">
              <RecentActivity />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </Guard>
  );
};

export default page;
