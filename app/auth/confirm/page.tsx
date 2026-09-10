"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleConfirmation() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }

    handleConfirmation();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
      <p className="text-[#8A8578]">Confirming your account...</p>
    </main>
  );
}