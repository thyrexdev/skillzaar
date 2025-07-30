
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Star, Calendar, DollarSign, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { clientService, CompletedProject, Review } from "@/services/clientService";

interface ClientWorkHistoryProps {
  clientId: string;
}

export const ClientWorkHistory = ({ clientId }: ClientWorkHistoryProps) => {
  const [completedProjects, setCompletedProjects] = useState<CompletedProject[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchCompletedProjects = async () => {
      try {
        const response = await clientService.getCompletedProjects(clientId);
        setCompletedProjects(response.projects);
      } catch (error) {
        console.error('Error fetching completed projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await clientService.getClientReviews(clientId);
        setReviews(response.reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchCompletedProjects();
    fetchReviews();
  }, [clientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (days: number) => {
    if (days < 30) return `${days} days`;
    const months = Math.round(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work History & Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="completed-projects">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="completed-projects">
              <Briefcase className="h-4 w-4 mr-2" />
              Completed Projects ({completedProjects.length})
            </TabsTrigger>
            <TabsTrigger value="freelancer-reviews">
              <Star className="h-4 w-4 mr-2" />
              Reviews from Freelancers ({reviews.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="completed-projects" className="mt-4 space-y-4">
            {loadingProjects ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading completed projects...</p>
              </div>
            ) : completedProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed projects yet.</p>
              </div>
            ) : (
              completedProjects.map((project) => (
                <div key={project.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <Badge variant="default">{project.status}</Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{project.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ${project.budget.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDuration(project.duration)}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Completed {formatDate(project.completedAt)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={project.freelancer.user.avatar} />
                        <AvatarFallback>{project.freelancer.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{project.freelancer.user.name}</span>
                    </div>
                    
                    {project.clientReview && (
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < project.clientReview!.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {project.clientReview?.comment && (
                    <p className="text-muted-foreground text-sm mt-2 italic">"${project.clientReview.comment}"</p>
                  )}
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="freelancer-reviews" className="mt-4 space-y-4">
            {loadingReviews ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No reviews from freelancers yet.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.freelancer.user.avatar} />
                        <AvatarFallback>{review.freelancer.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.freelancer.user.name}</p>
                        <p className="text-sm text-muted-foreground">Project: {review.project.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(review.createdAt)}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

