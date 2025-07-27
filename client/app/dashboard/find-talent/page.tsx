"use client";

import Guard from "@/components/Guard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const FindTalentPage = () => {
  return (
    <Guard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-foreground">Find Talent</h1>
            <p className="mt-2 text-muted-foreground">Discover and hire skilled freelancers for your projects.</p>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Search for Freelancers</h2>
            
            {/* Search and Filter Section */}
            <div className="space-y-4 mb-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search for skills, titles, or keywords..."
                  className="flex-1 px-4 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Search
                </button>
              </div>
              
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                  All Categories
                </button>
                <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                  Web Development
                </button>
                <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                  Design
                </button>
                <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                  Marketing
                </button>
                <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                  Writing
                </button>
              </div>
            </div>

            <div className="text-center py-12 text-muted-foreground">
              <p>Search results and freelancer profiles will appear here.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </Guard>
  );
};

export default FindTalentPage;
