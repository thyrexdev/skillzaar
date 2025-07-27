"use client";

import Guard from "@/components/Guard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const JobsPage = () => {
  return (
    <Guard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-foreground">My Jobs</h1>
            <p className="mt-2 text-muted-foreground">Manage all your posted jobs and track their progress.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-semibold text-foreground">12</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <svg className="h-6 w-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-semibold text-foreground">3</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-semibold text-foreground">7</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <svg className="h-6 w-6 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-semibold text-foreground">2</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                + Post New Job
              </button>
              <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                Filter
              </button>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                Export
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-card rounded-lg shadow">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Recent Jobs</h3>
            </div>
            <div className="divide-y divide-border">
              {/* Sample job entries */}
              {[
                { title: "Full-Stack Web Developer Needed", status: "Active", proposals: 8, budget: "$2,500", date: "Dec 15, 2024" },
                { title: "UI/UX Designer for Mobile App", status: "In Progress", proposals: 12, budget: "$1,800", date: "Dec 10, 2024" },
                { title: "Content Writer for Blog Posts", status: "Completed", proposals: 5, budget: "$500", date: "Dec 5, 2024" },
              ].map((job, index) => (
                <div key={index} className="px-6 py-4 hover:bg-accent/50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">{job.title}</h4>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          job.status === 'Active' ? 'bg-accent/20 text-accent-foreground' :
                          job.status === 'In Progress' ? 'bg-primary/20 text-primary-foreground' :
                          'bg-secondary/20 text-secondary-foreground'
                        }`}>
                          {job.status}
                        </span>
                        <span>{job.proposals} proposals</span>
                        <span>{job.budget}</span>
                        <span>Posted {job.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-primary hover:text-primary/80 text-sm">View</button>
                      <button className="text-muted-foreground hover:text-foreground">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </Guard>
  );
};

export default JobsPage;
