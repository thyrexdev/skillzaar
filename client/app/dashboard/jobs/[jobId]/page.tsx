"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Guard from "@/components/Guard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { jobService, Job, Proposal, UpdateJobData } from "@/services/jobService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, X, Calendar, DollarSign, Users, Clock, ArrowLeft, Settings, Trash2 } from "lucide-react";

const JobDetailsPage = () => {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Editable form state
  const [editForm, setEditForm] = useState<UpdateJobData>({
    title: "",
    description: "",
    budget: 0,
    category: "",
  });
  
  const params = useParams();
  const { jobId } = params;

  const categories = [
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Data Science",
    "Content Writing",
    "Digital Marketing",
    "SEO",
    "Graphics Design",
    "Video Editing",
    "Translation",
    "Other"
  ];

  useEffect(() => {
    if (jobId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [jobResponse, proposalsResponse] = await Promise.all([
            jobService.getJobById(jobId as string),
            jobService.getJobProposals(jobId as string, { page: 1, limit: 50 })
          ]);
          
          setJob(jobResponse.job);
          setProposals(proposalsResponse.data);
          
          // Initialize edit form with current job data
          setEditForm({
            title: jobResponse.job.title,
            description: jobResponse.job.description,
            budget: jobResponse.job.budget,
            category: jobResponse.job.category,
          });
          
          setError(null);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to fetch job details.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [jobId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setEditForm(prev => ({ ...prev, category: value }));
  };

  const handleSaveChanges = async () => {
    if (!jobId) return;
    setIsSaving(true);
    try {
      const { title, description, budget, category } = editForm;
      const updatedData: UpdateJobData = { title, description, budget: Number(budget), category };
      await jobService.updateJob(jobId as string, updatedData);
      setJob(prev => (prev ? { ...prev, ...updatedData } : null));
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save changes", error);
    } finally {
      setIsSaving(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      OPEN: { label: "Open", className: "bg-green-100 text-green-800" },
      IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
      COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-800" },
      CANCELED: { label: "Canceled", className: "bg-red-100 text-red-800" },
    }[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-red-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p>Job not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <Guard>
      <DashboardLayout>
        <div className="p-6 sm:p-8">
          <header className="mb-8">
            <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                {isEditing ? (
                  <Input 
                    name="title"
                    value={editForm.title}
                    onChange={handleInputChange}
                    className="text-3xl font-bold tracking-tight"
                  />
                ) : (
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{job.title}</h1>
                )}
                <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                  <StatusBadge status={job.status} />
                  <span>Last updated: {new Date(job.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Job
                  </Button>
                )}
              </div>
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Description</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                      {isEditing ? (
                        <Textarea 
                          name="description"
                          value={editForm.description}
                          onChange={handleInputChange}
                          rows={10}
                        />
                      ) : (
                        <p>{job.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center">
                        <DollarSign className="mr-3 h-5 w-5 text-muted-foreground" />
                        {isEditing ? (
                          <Input 
                            name="budget"
                            type="number"
                            value={editForm.budget}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <span className="font-medium">${job.budget}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{job.category}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Posted on {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{job._count.proposals} proposals received</span>
                      </div>
                    </CardContent>
                  </Card>
                  {isEditing && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select value={editForm.category} onValueChange={handleCategoryChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="proposals" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Received Proposals</CardTitle>
                </CardHeader>
                <CardContent>
                  {proposals.length > 0 ? (
                    <div className="divide-y divide-border">
                      {proposals.map(p => (
                        <div key={p.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{p.freelancer.user.name}</div>
                            <div className="text-sm text-muted-foreground">${p.proposedBudget}</div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{p.coverLetter}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No proposals received yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Job Status</h4>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELED">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border-t border-destructive/20 pt-6">
                    <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                    <Button variant="destructive" disabled>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Job
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Deleting a job is permanent and cannot be undone.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </Guard>
  );
};

export default JobDetailsPage;
