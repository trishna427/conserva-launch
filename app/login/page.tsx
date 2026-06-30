"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Leaf, Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8">
        <div className="pt-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Leaf size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">Welcome back</h1>
          <p className="mt-3 text-[#8A8578]">
            Log in to your virtual fridge.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-10 space-y-5">
          <label className="block">
            <span className="mb-2 block font-semibold">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4">
              <Mail className="text-[#8A8578]" size={20} />
              <input
                className="w-full outline-none"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">Password</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4">
              <Lock className="text-[#8A8578]" size={20} />
              <input
                className="w-full outline-none"
                placeholder="Your password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          {message && (
            <p className="rounded-2xl bg-white px-4 py-3 text-center text-sm text-[#8A8578]">
              {message}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-8 text-center text-[#8A8578]">
          New to Conserva?{" "}
          <Link href="/signup" className="font-bold text-[#3F6B4F]">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}