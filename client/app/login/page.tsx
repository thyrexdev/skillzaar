"use client";

import { handleLogin } from "@/lib/handlers/authHandlers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/stores/useAuth";
import { loginSchema } from "@/schemas/loginSchema";
import z from "zod";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type FormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const router = useRouter();

  const { error, isLoading, clearError } = useAuth();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    await handleLogin(data.email, data.password, data.role);
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
          <h2 className="text-2xl font-semibold text-center">Sign In</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <a 
              href="/forgot-password" 
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Forgot your password?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
