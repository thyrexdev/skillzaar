"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/schemas/registerSchema";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleRegister } from "@/lib/handlers/authHandlers";
import { useAuth } from "@/stores/useAuth";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {MIDDLE_EAST_COUNTRIES} from "@/constants/countries"
import Link from "next/link";
import Image from "next/image";

type FormData = z.infer<typeof registerSchema>;
type Role = "CLIENT" | "FREELANCER";

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading, clearError } = useAuth();
  const [pickedRole, setPickedRole] = useState<Role | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: undefined,
      country: undefined,
      agree: false,
    },
  });

  // Load role from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("role");
    const upper = raw?.toUpperCase();
    const normalized =
      upper === "CLIENT" || upper === "FREELANCER" ? (upper as Role) : null;

    if (!normalized) {
      router.replace("/choose-role");
      return;
    }

    setPickedRole(normalized);
    setValue("role", normalized, { shouldValidate: true });
  }, [router, setValue]);

  useEffect(() => () => clearError(), [clearError]);

  const onSubmit = async (data: FormData) => {
    try {
      await handleRegister(
        data.name,
        data.email,
        data.phoneNumber,
        data.country,
        data.password,
        data.role
      );
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const role = watch("role") as Role | undefined;
  const isFreelancer = role === "FREELANCER";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen font-sans">
      {/* Left side (Form) */}
      <div className="p-10 bg-white flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center max-w-lg mx-auto mb-8">
            <h2 className="text-4xl font-bold mb-3 text-gray-800">
              {isFreelancer ? "إنشاء حساب كمستقل" : "إنشاء حساب كعميل"}
            </h2>
            <p className="text-2xl text-gray-600">
              {isFreelancer
                ? "ابدأ بعرض خدماتك وتقديم عروض على المشاريع المناسبة لك"
                : "ابدأ بنشر مشروعك والحصول على عروض من أفضل المستقلين"}
            </p>
          </div>

          {/* Social buttons */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border border-gray-300 shadow-sm hover:bg-gray-100"
          >
<Image src="/search 1.svg" alt="Google logo" width={20} height={20} />
            جوجل
          </Button>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 mt-4">
            <input
              type="hidden"
              {...register("role")}
              value={pickedRole ?? ""}
              readOnly
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="الاسم بالكامل"
                {...register("name")}
                className="underline-input"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}

              <Input
                type="email"
                placeholder="البريد الإلكتروني"
                {...register("email")}
                className="underline-input"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="password"
                placeholder="كلمة المرور"
                {...register("password")}
                className="underline-input"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}

              <Input
                type="password"
                placeholder="تأكيد كلمة المرور"
                {...register("confirmPassword")}
                className="underline-input"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Input
              type="text"
              placeholder="رقم الجوال"
              {...register("phoneNumber")}
              className="underline-input"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">
                {errors.phoneNumber.message}
              </p>
            )}

            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="underline-input">
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {MIDDLE_EAST_COUNTRIES.map((c) => (
  <SelectItem key={c.name} value={c.name}>
    {c.name}
  </SelectItem>
))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.country && (
              <p className="text-red-500 text-sm">{errors.country.message}</p>
            )}

            {/* Agreement */}
            <Controller
              control={control}
              name="agree"
              render={({ field }) => (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Input
                    type="checkbox"
                    id="agree"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <label htmlFor="agree" className="cursor-pointer select-none">
                    أوافق على الشروط والأحكام وسياسة الخصوصية
                  </label>
                </div>
              )}
            />

            {errors.agree && (
              <p className="text-red-500 text-sm">{errors.agree.message}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-md"
              disabled={isLoading || !pickedRole}
            >
              {isLoading ? "جاري إنشاء الحساب..." : "تسجيل"}
            </Button>

            <div className="text-center mt-2">
              <label>
                هل لديك حساب بالفعل؟{" "}
                <Link href="/login" className="text-primary">
                  تسجل الدخول
                </Link>
              </label>
            </div>
          </form>
        </div>
      </div>

      {/* Right side (Image) */}
      <div className="relative hidden md:flex bg-[#7c3aed] justify-center items-center">
        <Image
          src="/profile.png"
          alt="Profile illustration"
          className="absolute w-4/5 max-w-lg bottom-0 right-0 drop-shadow-xl"
          width={500}
          height={500}
        />
      </div>
    </div>
  );
}
