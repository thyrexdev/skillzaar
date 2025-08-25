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
    <div>
    <div className="container flex min-h-24 font-sans justify-center items-center">
      <div className="flex-1 p-10 bg-[#f9f9f9]">
        <h2 className=" text-2xl mb-2.5 ">اعاده تعيين كلمه المرور </h2>
        <p className="mb-5 ">أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة التعيين.</p>
        <form className="flex flex-col gap-3.5 ">
          <input type="email" placeholder="البريد الإلكتروني" required className="p-2.5 border-solid border-r-4" />
          <div className="flex items-center text-2xl">
            <input type="checkbox" id="agree" className="ml-1 " />
            <label htmlFor="agree">تذكرني</label>
            <Link href="#" className="p-20 ">هل نسيت كلمه المرور ؟</Link>
 </div>
          <button type="submit" className="bg-[#7c3aed] text-white p-3 border-none border-r-4 cursor-pointer">اعاده تعيين</button>
          <p className="">ليس لدي حساب ؟ انشاء حساب </p>
        </form>
      </div>
       <div className="flex-1  bg-[#7c3aed] justify-center items-center ">
        <img src="/profile.png" className=" w-4/5 max-w-96" />
      </div>
    </div>
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full md:w-1/2 mb-6 md:mb-0">
      </div>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-right">تحقق من بريدك الإلكتروني</h2>
        <p className="text-sm text-right mb-4">
 ادخل رمز التحقق المكوّن من 6 أرقام الذي أُرسل إلى بريدك الإلكتروني
        </p>
        <div className="flex justify-center gap-2 mb-6">
            <input 
            
              type="text"
              maxLength={1}
              className="w-10 h-12 text-center border rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"   />
        
        </div>

        <button
        
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
        >
          إرسال
        </button>
        <p className="text-center text-gray-500 text-sm mt-4">
          لم يصلك الرمز؟ إعادة الإرسال بعد 30 ثانية
        </p>
      </div>
       <img
          src="/profile.png" // بدّليها بصورة مناسبة
          alt="support"
          className=" flex-1  bg-[#7c3aed] justify-center items-center"
        />
    </div>
        </div>
  );
};

export default ForgotPasswordPage;
