"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type Role = "CLIENT" | "FREELANCER";

function RoleCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white p-6 w-[470px] h-[500px] rounded-2xl border cursor-pointer shadow-sm
        ${selected ? "border-violet-500" : "border-gray-200"}`}
    >
      {/* محتوى الكارت */}
      <div className="flex flex-col items-center justify-center h-full text-center">
        {children}
      </div>

      {/* شريط الاختيار القادم من الأسفل */}
      <motion.div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 bg-primary"
        initial={false}
        animate={{ height: selected ? 20 : 0 }} // غيّر 20px لو عايز الشريط أسمك/أرفع
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      />
    </div>
  );
}

export default function ChooseRolePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  const handleNext = () => {
    if (!role) return;
    localStorage.setItem("role", role);
    router.push("/register");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center font-sans">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">ما هو دورك؟</h2>
      <p className="text-gray-500 mb-8">اختر نوع حسابك، يمكنك تغييره لاحقًا</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <RoleCard
          selected={role === "FREELANCER"}
          onClick={() => setRole("FREELANCER")}
        >
          <Image width={152} height={152} src="/freelancers.svg" alt="" className="mb-4" />
          <h3 className="text-lg font-semibold">المستقلون</h3>
          <p className="text-gray-500 text-center text-sm mt-2">
            اعرض مهاراتك وخدماتك، وتقدم على المشاريع لتحصل على عملاء جدد وتوسع دخلك.
          </p>
        </RoleCard>

        <RoleCard
          selected={role === "CLIENT"}
          onClick={() => setRole("CLIENT")}
        >
          <Image width={152} height={152} src="/client.svg" alt="" className="mb-4" />
          <h3 className="text-lg font-semibold">صاحب المشاريع (العملاء)</h3>
          <p className="text-gray-500 text-center text-sm mt-2">
            انشر مشروعك بسهولة واحصل على عروض من أفضل المستقلين لتنفيذه بجودة واحترافية.
          </p>
        </RoleCard>
      </div>

      <button
        onClick={handleNext}
        disabled={!role}
        className="px-8 py-3 bg-primary text-white rounded-xl disabled:opacity-50"
      >
        التالي
      </button>
    </div>
  );
}
