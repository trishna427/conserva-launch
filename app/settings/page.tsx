"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronLeft, Moon, User } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Preferences = {
  id: string;
  user_id: string;
  email_reminders: boolean;
  in_app_reminders: boolean;
  days_before: number;
  theme: string;
};

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (data) {
        setPreferences(data);
      } else {
        const { data: created } = await supabase
          .from("user_preferences")
          .insert({
            user_id: session.user.id,
            email_reminders: true,
            in_app_reminders: true,
            days_before: 2,
            theme: "light",
          })
          .select()
          .single();

        setPreferences(created);
      }

      setLoading(false);
    }

    loadPreferences();
  }, []);

  async function updatePreferences(changes: Partial<Preferences>) {
    if (!preferences) return;

    const updated = {
      ...preferences,
      ...changes,
    };

    setPreferences(updated);
    setSaving(true);

    await supabase
      .from("user_preferences")
      .update({
        email_reminders: updated.email_reminders,
        in_app_reminders: updated.in_app_reminders,
        days_before: updated.days_before,
        theme: updated.theme,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updated.id);

    setSaving(false);
  }

  if (loading || !preferences) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
        <p className="text-[#8A8578]">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section
  className="min-h-screen w-full max-w-[430px] px-6 pb-28"
  style={{
    paddingTop: "max(72px, calc(env(safe-area-inset-top) + 24px))",
  }}
>
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2 font-bold text-[#3F6B4F]"
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        <h1 className="mb-8 font-serif text-4xl font-bold">Settings</h1>

        <div className="mb-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <User className="text-[#3F6B4F]" />
            <h2 className="font-serif text-2xl font-bold">Account</h2>
          </div>

          <p className="text-[#8A8578]">
            More account settings coming soon.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <Bell className="text-[#3F6B4F]" />
            <h2 className="font-serif text-2xl font-bold">Reminders</h2>
          </div>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-semibold">In-App Reminders</p>
              <p className="text-sm text-[#8A8578]">
                Show reminders inside Conserva.
              </p>
            </div>

            <input
              type="checkbox"
              checked={preferences.in_app_reminders}
              onChange={() =>
                updatePreferences({
                  in_app_reminders: !preferences.in_app_reminders,
                })
              }
            />
          </div>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-semibold">Email Reminders</p>
              <p className="text-sm text-[#8A8578]">
                Receive a daily kitchen update.
              </p>
            </div>

            <input
              type="checkbox"
              checked={preferences.email_reminders}
              onChange={() =>
                updatePreferences({
                  email_reminders: !preferences.email_reminders,
                })
              }
            />
          </div>

          <div>
            <p className="mb-2 font-semibold">Remind me</p>

            <select
              value={preferences.days_before}
              onChange={(e) =>
                updatePreferences({
                  days_before: Number(e.target.value),
                })
              }
              className="w-full rounded-2xl border border-[#E7E2D6] bg-white p-4"
            >
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
            </select>
          </div>

          <p className="mt-4 text-sm text-[#8A8578]">
            {saving ? "Saving..." : "Settings saved automatically."}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <Moon className="text-[#3F6B4F]" />
            <h2 className="font-serif text-2xl font-bold">Appearance</h2>
          </div>

          <p className="text-[#8A8578]">Dark mode coming soon.</p>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}