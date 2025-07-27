"use client";

import { useAuth } from "@/stores/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Guard = ({children}: {children: React.ReactNode}) => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoggedIn) {
      router.push("/login");
    }
  }, [isClient, isLoggedIn, router]);

  // Show loading or nothing while hydrating to prevent flash
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return <>{children}</>;
};

export default Guard;
