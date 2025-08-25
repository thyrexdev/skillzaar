"use client";

import React from "react";
import Image from "next/image";

const VerifyIdentity = () => {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-purple-700 to-purple-500 text-white p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">ملفك الشخصي</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b">
        <div className="flex gap-6 py-3 text-sm">
          <button className="text-gray-600 hover:text-purple-600">الملف الشخصي</button>
          <button className="border-b-2 border-purple-600 text-purple-600 font-medium">
            توثيق الهوية
          </button>
          <button className="text-gray-600 hover:text-purple-600">طرق الدفع</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">توثيق هوية</h2>
        <p className="text-gray-600 mb-6">
          وثق هويتك لزيادة الأمان والثقة. نحن نهتم بسلامة معلوماتك، توثيق هويتك يساعد في بناء الثقة بين العملاء والمستقلين.
        </p>

        {/* Steps */}
        <div className="mb-6 text-sm text-gray-700">
          <h3 className="font-semibold mb-2">اختيار طريقة الدفع</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>قم باختيار طريقة الدفع المناسبة لك وسوف تصلك رمز تفعيل أو رسالة على بريدك.</li>
          </ul>
          <h3 className="font-semibold mt-4 mb-2">مستندات مطلوبة</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>بطاقة هوية أو جواز سفر أو رخصة قيادة سارية.</li>
            <li>صورة سيلفي واضحة مع الوجه الأمامي للوثيقة.</li>
          </ul>
        </div>

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front ID */}
          <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-white">
            <p className="mb-2 text-gray-600">الوجه الأمامي</p>
            <label className="cursor-pointer flex flex-col items-center">
             <Image src="/identify.png" alt="camera" width={300} height={160}/>
              <input type="file" className="hidden" />
              <span className="text-sm text-gray-500 mt-1">رفع الصورة</span>
            </label>
          </div>

          {/* Back ID */}
          <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-white">
            <p className="mb-2 text-gray-600">الوجه الخلفي</p>
            <label className="cursor-pointer flex flex-col items-center">
              <span className="text-purple-600 text-3xl">＋</span>
              <input type="file" className="hidden" />
              <span className="text-sm text-gray-500 mt-1">رفع الصورة</span>
            </label>
          </div>
        </div>

        {/* Selfie with ID */}
        <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-white mt-6">
          <p className="mb-2 text-gray-600">صورة سيلفي مع الوجه الأمامي للوثيقة</p>
          <label className="cursor-pointer flex flex-col items-center">
            <span className="text-purple-600 text-3xl"><img src={"/camera.svg"} className="bg-purple-600"/></span>
            <input type="file" className="hidden" />
            <span className="text-sm text-gray-500 mt-1">رفع الصورة</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-center mt-8">
          <button className="bg-purple-600 text-white px-8 py-2 rounded-md hover:bg-purple-700 transition">
            إرسال المراجعة
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyIdentity;
