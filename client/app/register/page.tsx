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

import { handleRegister } from "@/lib/handlers/authHandlers";
import { useAuth } from "@/stores/useAuth";

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
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
   <div className="container flex min-h-24 font-sans">
      <div className="flex-1 p-10 bg-[#f9f9f9]">
        <h2 className=" text-2xl mb-2.5">إنشاء حساب كعميل</h2>
        <p className="mb-5 ">ابدأ بنشر مشروعك والحصول على عروض من أفضل المستقلين</p>
        <div className="flex gap-2.5 mb-5">
          <button className=" flex-1/2 p-2.5 border-r-4 border-none cursor-pointer facebook bg-[#fff] "> Sign up with Facebook</button>
          <img src="/facebook 1.svg" alt="" />
          <button className="flex-1/2 p-2.5 border-r-4 cursor-pointer google bg-[#fff] border-solid"> Sign up with Google</button>
          <img src="/search 1.svg" alt="" />
        </div>
        <form className="flex flex-col gap-3.5 ">
          <div>
          <input type="text" placeholder=" الأسم بالكامل" required className="p-2.5 border-solid border-r-4" />
          <input type="text" placeholder="الاسم الأخير" required className="p-2.5 border-solid border-r-4"/>
          </div>
          <div>
          <input type="email" placeholder="البريد الإلكتروني" required className="p-2.5 border-solid border-r-4" />
          <input type="password" placeholder="كلمة المرور" required  className="p-2.5 border-solid border-r-4"/>
          </div>
          <input type="text" placeholder="رقم الجوال"className="p-2.5 border-solid border-r-4" />

          <div className="flex items-center text-2xl">
            <input type="checkbox" id="agree" className="ml-1 " />
            <label htmlFor="agree">أوافق على الشروط والأحكام وسياسة الخصوصية</label>
 </div>
          <button type="submit" className="bg-[#7c3aed] text-white p-3 border-none border-r-4 cursor-pointer">إنشاء حساب</button>
        </form>
      </div>
       <div className="flex-1  bg-[#7c3aed] justify-center items-center ">
        <img src="/profile.png" className=" w-4/5 max-w-96" />
      </div>
    </div>
  );
}