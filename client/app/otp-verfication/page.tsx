import React from "react";
import Image from "next/image";

const Page = () => {
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
          <h2 className="text-xl font-bold mb-4 text-right">تحقق من بريدك الإلكتروني</h2>
          <p className="text-sm text-right mb-6 text-gray-600">
            أدخل رمز التحقق المكوّن من 6 أرقام الذي أُرسل إلى بريدك الإلكتروني.
          </p>

          {/* OTP inputs */}
          <div className="flex justify-center gap-3 mb-6">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                className="w-12 h-12 text-center border rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ))}
          </div>

          {/* Submit button */}
          <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition">
            إرسال
          </button>

          {/* Resend text */}
          <p className="text-center text-gray-500 text-sm mt-4">
            لم يصلك الرمز؟{" "}
            <span className="text-gray-700 font-medium">إعادة الإرسال بعد 30 ثانية</span>
          </p>
        </div>
      </div>

      {/* Left side (image with background) */}
     
    </div>
  );
};

export default Page;
