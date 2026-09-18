"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated!");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section
        className="min-h-screen w-full max-w-[430px] px-6"
        style={{
          paddingTop: "max(72px, calc(env(safe-area-inset-top) + 24px))",
        }}
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <KeyRound size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">
            Reset password
          </h1>

          <p className="mt-3 text-[#8A8578]">
            Choose a new password for your Conserva account.
          </p>
        </div>

        <form onSubmit={handleReset} className="mt-10 space-y-5">
          <label className="block">
            <span className="mb-2 block font-semibold">New password</span>

            <div className="flex items-center gap-3 rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4">
              <Lock className="text-[#8A8578]" size={20} />

              <input
                className="w-full outline-none"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">
              Confirm new password
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4">
              <Lock className="text-[#8A8578]" size={20} />

              <input
                className="w-full outline-none"
                type="password"
                placeholder="Enter it again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}