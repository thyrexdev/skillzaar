"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/schemas/forgotPasswordSchema";
import { requestPasswordReset } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import z from "zod";

type FormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setMessage("");
      await requestPasswordReset(data.email);
      setMessage("OTP has been sent to your email address. Please check your inbox.");
      setIsSuccess(true);
      
      // Redirect to reset password page after a short delay
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
      }, 2000);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Failed to send reset email. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-xl p-4">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-center">
            Forgot Password
          </h2>
          <p className="text-sm text-center text-muted-foreground">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                placeholder="Enter your email address"
                type="email"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending OTP..." : "Send Reset OTP"}
            </Button>
            
            {message && (
              <p className={`text-sm text-center mt-2 ${isSuccess ? 'text-green-600' : 'text-destructive'}`}>
                {message}
              </p>
            )}
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
