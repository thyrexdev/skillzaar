"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { clientService, Job } from "@/services/clientService";

interface ClientActiveProjectsProps {
  clientId: string;
}

export const ClientActiveProjects = ({ clientId }: ClientActiveProjectsProps) => {
  const [activeProjects, setActiveProjects] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientJobs = async () => {
      try {
        const response = await clientService.getClientJobs(clientId);
        // Filter only active jobs (OPEN and IN_PROGRESS)
        const activeJobs = response.jobs.filter(job => 
          job.status === "OPEN" || job.status === "IN_PROGRESS"
        );
        setActiveProjects(activeJobs);
      } catch (error) {
        console.error("Error fetching client jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientJobs();
  }, [clientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Job Postings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading active jobs...</p>
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active job postings.</p>
          </div>
        ) : (
          activeProjects.map((project) => (
            <div key={project.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{project.title}</h3>
                <Badge variant="outline">{project.category}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{project.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ${project.budget.toLocaleString()}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {project._count?.proposals || 0} proposals
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  Posted on {formatDate(project.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
