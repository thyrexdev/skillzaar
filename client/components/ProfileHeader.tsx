"use client";

import { useState } from "react";
import { useAuth } from "@/stores/useAuth";

export default function ProfileHeader() {
  const user = useAuth((state) => state.user);
  const login = useAuth((state) => state.login);
  const logout = useAuth((state) => state.logout);

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  const handleLogin = () => {
    const fakeUser = {
      id: Date.now().toString(),
      name: form.name,
      email: form.email,
    };
    const fakeToken = "token_" + Date.now();
    login(fakeUser, fakeToken);
    setShowLoginForm(false);
    setForm({ name: "", email: "" })
  };

  return (
    <div className="p-6 rounded-2xl bg-card shadow-md w-full max-w-md mx-auto mt-10 space-y-5 text-center text-card-foreground">
      {user ? (
        <>
          <h2 className="text-2xl font-bold">أهلاً، {user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <button
            onClick={logout}
            className="mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md transition"
          >
            تسجيل الخروج
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold">مرحبًا بك!</h2>
          <button
            onClick={() => setShowLoginForm(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition"
          >
            تسجيل الدخول
          </button>
        </>
      )}

      {showLoginForm && (
        <div className="mt-4 bg-card p-4 rounded-lg shadow text-right space-y-3">
          <input
            type="text"
            placeholder="الاسم"
            className="block w-full p-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="block w-full p-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <button
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md w-full transition"
          >
            تسجيل
          </button>
        </div>
      )}
    </div>
  );
}
