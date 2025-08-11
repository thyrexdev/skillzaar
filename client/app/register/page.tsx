// app/(auth)/register/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/schemas/registerSchema";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { handleRegister } from "@/lib/handlers/authHandlers";
import { useAuth } from "@/stores/useAuth";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'FREELANCER' | ''>('');
  const { error, isLoading, clearError } = useAuth();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: FormData) => {
    await handleRegister(data.name, data.email, data.password, data.role);
    router.push("/dashboard");
  };

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-xl p-4">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-center">Create Account</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input placeholder="Name" {...formRegister("name")} />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Input
                placeholder="Email"
                type="email"
                {...formRegister("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Input
                placeholder="Password"
                type="password"
                {...formRegister("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive font-medium text-center">
                {error}
              </p>
            )}
            <div>
              <select
                {...formRegister("role")}
                onChange={(e) => {
                  formRegister("role").onChange(e);
                  setSelectedRole(e.target.value as 'CLIENT' | 'FREELANCER' | '');
                }}
                className="w-full border rounded-md px-3 py-2 text-sm bg-input text-foreground border-border focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Role</option>
                <option value="CLIENT">Client</option>
                <option value="FREELANCER">Freelancer</option>
              </select>
              {errors.role && (
                <p className="text-sm text-destructive mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
          </form>
          
          {/* OAuth Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <OAuthButtons 
                role={selectedRole as 'CLIENT' | 'FREELANCER'}
                onSuccess={() => router.push('/dashboard')}
                onError={(error) => clearError()}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
