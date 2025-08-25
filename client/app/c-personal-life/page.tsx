"use client";

import React from "react";
import Image from "next/image";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
       
      {/* Header */}
      <div className="bg-gradient-to-l from-purple-700 to-purple-500 text-white p-4 flex justify-between items-center">
       
        <h1 className="text-lg font-semibold">ملفك الشخصي</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b">
          
        <div className="flex gap-6 py-3 text-sm">
                      <div className="w-full md:w-1/4 flex flex-col items-center">
          <Image
            src="/personal.png"
            alt="Profile"
            width={120}
            height={120}
            className="rounded-full border"
          />
          <div className="flex gap-3 mt-3">
            <button className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300">
              📷
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300">
              🗑️
            </button>
          </div>
        </div> 
          <button className="border-b-2 border-purple-600 text-purple-600 font-medium">
            الملف الشخصي
          </button>
          <button className="text-gray-600 hover:text-purple-600">
            توثيق الهوية
          </button>
          <button className="text-gray-600 hover:text-purple-600">
            طرق الدفع
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 p-6">
        {/* Form */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            ملفك الشخصي
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            أكمل ملفك الشخصي لبدء العمل
          </p>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="الاسم الأول"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="اسم الآخر"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="المسمى الوظيفي"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              placeholder="نبذة تعريفية"
              rows={3}
              className="col-span-2 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            ></textarea>
            <input
              type="text"
              placeholder="رابط معرض الأعمال"
              className="col-span-2 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>الدولة</option>
              <option>مصر</option>
              <option>السعودية</option>
              <option>الإمارات</option>
            </select>
            <input
              type="text"
              placeholder="المهارات"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button
              type="submit"
              className="col-span-2 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
            >
              التالي
            </button>
          </form>
        </div>

        {/* Profile Image */}
       
      </div>
    </div>
  );
};

export default ProfilePage;
