"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/schemas/forgotPasswordSchema";
import { verifyOtpAndResetPassword } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import z from "zod";

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email },
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    try {
      setIsLoading(true);
      setMessage("");
      await verifyOtpAndResetPassword(data.email, data.otp, data.newPassword);
      setMessage("Your password has been reset successfully. Redirecting to login...");
      setIsSuccess(true);
      
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Failed to reset password. Please try again.");
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
            Reset Password
          </h2>
          <p className="text-sm text-center text-muted-foreground">
            Enter the OTP sent to your email, and choose a new password.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Input
                placeholder="Enter 6-digit OTP"
                type="text"
                maxLength={6}
                {...register("otp")}
                disabled={isLoading}
              />
              {errors.otp && (
                <p className="text-sm text-destructive mt-1">
                  {errors.otp.message}
                </p>
              )}
            </div>
            <div>
              <Input
                placeholder="New Password"
                type="password"
                {...register("newPassword")}
                disabled={isLoading}
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <Input
                placeholder="Confirm Password"
                type="password"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
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

export default ResetPasswordPage;

