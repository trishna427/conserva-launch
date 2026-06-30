"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Leaf, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created! Check your email, then log in.");
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8">
        <div className="pt-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Leaf size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">Create account</h1>
          <p className="mt-3 text-[#8A8578]">
            Start tracking your kitchen gently.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="mt-10 space-y-5">
          <label className="block">
            <span className="mb-2 block font-semibold">Name</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4">
              <User className="text-[#8A8578]" size={20} />
              <input
                className="w-full outline-none"
                placeholder="Your name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          </label>

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
                placeholder="At least 6 characters"
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
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-8 text-center text-[#8A8578]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#3F6B4F]">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}