
"use client";

import { useAuth } from "@/stores/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProfilePage = () => {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn && user) {
      router.push(`/profile/client/${user.id}`);
    } else {
      router.push("/login");
    }
  }, [isLoggedIn, user, router]);

  return null;
};

export default ProfilePage;

