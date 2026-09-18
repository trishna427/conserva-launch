"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ChevronLeft, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email for a password reset link.");
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section
        className="min-h-screen w-full max-w-[430px] px-6"
        style={{
          paddingTop: "max(72px, calc(env(safe-area-inset-top) + 24px))",
        }}
      >
        <Link
          href="/login"
          className="mb-8 flex items-center gap-2 font-bold text-[#3F6B4F]"
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <KeyRound size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">
            Forgot password?
          </h1>

          <p className="mt-3 text-[#8A8578]">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleReset} className="mt-10 space-y-5">
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

          {message && (
            <p className="rounded-2xl bg-white px-4 py-3 text-center text-sm text-[#8A8578]">
              {message}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </section>
    </main>
  );
}