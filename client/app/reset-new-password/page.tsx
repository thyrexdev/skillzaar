"use client";

import React, { useState } from "react";
import Image from "next/image";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex flex-col md:flex-row-reverse min-h-screen" dir="rtl">
       <div className="hidden md:flex w-full md:w-1/2 bg-purple-600 items-center justify-center p-8">
        <Image
          src="/profile.png"
          alt="profile"
          width={400}
          height={400}
          className="rounded-lg object-contain"
        />
      </div>
      {/* Right side (form) */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-right">تعيين كلمة مرور جديدة</h2>
          <p className="text-sm text-right mb-6 text-gray-600">
            أدخل كلمة مرور جديدة لتأمين حسابك.
          </p>

          {/* New Password */}
          <div className="mb-4 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور الجديدة*"
              className="w-full border-b-2 border-gray-300 focus:border-purple-600 outline-none py-2 pr-8"
            />
            <span
              className="absolute right-2 top-2 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="mb-6 relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="تأكيد كلمة المرور الجديدة*"
              className="w-full border-b-2 border-gray-300 focus:border-purple-600 outline-none py-2 pr-8"
            />
            <span
              className="absolute right-2 top-2 cursor-pointer text-gray-500"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Save Button */}
          <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition">
            حفظ كلمة المرور
          </button>

          {/* Back to login */}
          <p className="text-center text-gray-500 text-sm mt-4">
            تذكرت كلمة المرور؟{" "}
            <a href="/login" className="text-purple-600 hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>

      {/* Left side (image with background) */}
     
    </div>
  );
};

export default ResetPassword;
