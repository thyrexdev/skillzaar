"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Globe, Calendar } from "lucide-react";
import { ClientProfile } from "@/services/clientService";

interface ClientAboutProps {
  client: ClientProfile;
}

export const ClientAbout = ({ client }: ClientAboutProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About {client.fullName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {client.bio || "No biography provided yet. This client hasn't added a description about themselves or their business."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Building className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-medium">{client.companyName || "Company not specified"}</p>
              <p className="text-sm text-muted-foreground">Company Name</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Globe className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-medium">{client.website || "Website not provided"}</p>
              <p className="text-sm text-muted-foreground">Website</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member Since</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-medium">
                {new Date(client.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-muted-foreground">Joined Skillzaar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

