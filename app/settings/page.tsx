

"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronLeft, Moon, User } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

type Preferences = {
  id: string;
  user_id: string;
  email_reminders: boolean;
  in_app_reminders: boolean;
  days_before: number;
  theme: string;
};

export default function SettingsPage() {
  const [preferences, setPreferences] =
    useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isNativeApp, setIsNativeApp] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setIsNativeApp(
      Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === "ios"
    );

    async function loadPreferences() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

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

    void loadPreferences();
  }, []);

  async function updatePreferences(
    changes: Partial<Preferences>
  ) {
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

  async function enablePushNotifications() {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "ios"
    ) {
      return;
    }

    setRegisteringPush(true);
    setPushMessage("Requesting notification permission...");

    try {
      const permission =
        await PushNotifications.requestPermissions();

      if (permission.receive !== "granted") {
        setPushMessage(
          "Notifications are not allowed. You can enable them in your iPhone Settings."
        );
        setRegisteringPush(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPushMessage(
          "Please log in before enabling push notifications."
        );
        setRegisteringPush(false);
        return;
      }

      // Prevent duplicate listeners if the button is tapped again.
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener(
        "registration",
        async (token) => {
          try {
            setPushMessage(
              "Saving your iPhone registration..."
            );

            const { error } = await supabase
              .from("push_tokens")
              .upsert(
                {
                  user_id: session.user.id,
                  token: token.value,
                  platform: "ios",
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: "user_id,token",
                }
              );

            if (error) {
              console.error(
                "Failed to save push token:",
                error
              );

              setPushMessage(
                "Your iPhone registered with Apple, but Conserva couldn't save the device. Please try again."
              );
              return;
            }

            setPushMessage(
              "Push notifications enabled! Your iPhone is connected to Conserva."
            );
          } catch (error) {
            console.error(
              "Push token saving failed:",
              error
            );

            setPushMessage(
              "Could not save your iPhone registration. Please try again."
            );
          } finally {
            setRegisteringPush(false);
          }
        }
      );

      await PushNotifications.addListener(
        "registrationError",
        (error) => {
          console.error(
            "Apple push registration failed:",
            error
          );

          setPushMessage(
            "Could not register this iPhone for push notifications. Please try again."
          );

          setRegisteringPush(false);
        }
      );

      setPushMessage(
        "Registering your iPhone with Apple..."
      );

      await PushNotifications.register();
    } catch (error) {
      console.error(
        "Push notification setup failed:",
        error
      );

      setPushMessage(
        "Something went wrong while enabling push notifications."
      );

      setRegisteringPush(false);
    }
  }
  async function deleteAccount() {
    if (deletingAccount) return;
  
    setDeletingAccount(true);
    setDeleteError("");
  
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
  
      if (sessionError || !session) {
        throw new Error("Your session has expired. Please sign in again.");
      }
  
      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(
          result.error || "We couldn't delete your account. Please try again."
        );
      }
  
      await supabase.auth.signOut();
      window.location.replace("/");
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
      setDeletingAccount(false);
    }
  }
  if (loading || !preferences) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
        <p className="text-[#8A8578]">
          Loading settings...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section
        className="min-h-screen w-full max-w-[430px] px-6 pb-28"
        style={{
          paddingTop:
            "max(72px, calc(env(safe-area-inset-top) + 24px))",
        }}
      >
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2 font-bold text-[#3F6B4F]"
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        <h1 className="mb-8 font-serif text-4xl font-bold">
          Settings
        </h1>

        <div className="mb-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <User className="text-[#3F6B4F]" />
            <h2 className="font-serif text-2xl font-bold">
              Account
            </h2>
          </div>

          <div className="border-t border-[#E7E2D6] pt-4">
  <p className="text-sm text-[#8A8578]">
    Permanently remove your Conserva account and its associated data.
  </p>

  {!showDeleteConfirmation ? (
    <button
      type="button"
      onClick={() => {
        setDeleteError("");
        setShowDeleteConfirmation(true);
      }}
      className="mt-4 text-sm font-semibold text-[#B4534B]"
    >
      Delete Account
    </button>
  ) : (
    <div className="mt-4 rounded-2xl border border-[#E8C9C5] bg-[#FFF8F6] p-4">
      <p className="font-semibold text-[#8F3833]">
        Delete your account permanently?
      </p>

      <p className="mt-2 text-sm leading-6 text-[#7B625E]">
        This will delete your Conserva account, saved food, recipes,
        reminder preferences, and notification registrations. This
        action cannot be undone.
      </p>

      {deleteError && (
        <p role="alert" className="mt-3 text-sm text-[#B4534B]">
          {deleteError}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setShowDeleteConfirmation(false);
            setDeleteError("");
          }}
          disabled={deletingAccount}
          className="rounded-xl border border-[#E7E2D6] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={deleteAccount}
          disabled={deletingAccount}
          className="rounded-xl bg-[#B4534B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {deletingAccount ? "Deleting..." : "Yes, delete my account"}
        </button>
      </div>
    </div>
  )}
</div>
        </div>

        <div className="mb-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <Bell className="text-[#3F6B4F]" />
            <h2 className="font-serif text-2xl font-bold">
              Reminders
            </h2>
          </div>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-semibold">
                In-App Reminders
              </p>
              <p className="text-sm text-[#8A8578]">
                Show reminders inside Conserva.
              </p>
            </div>

            <input
              type="checkbox"
              checked={preferences.in_app_reminders}
              onChange={() =>
                updatePreferences({
                  in_app_reminders:
                    !preferences.in_app_reminders,
                })
              }
            />
          </div>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-semibold">
                Email Reminders
              </p>
              <p className="text-sm text-[#8A8578]">
                Receive a daily kitchen update.
              </p>
            </div>

            <input
              type="checkbox"
              checked={preferences.email_reminders}
              onChange={() =>
                updatePreferences({
                  email_reminders:
                    !preferences.email_reminders,
                })
              }
            />
          </div>

          {isNativeApp && (
            <div className="mb-5 border-t border-[#E7E2D6] pt-5">
              <p className="font-semibold">
                Push Notifications
              </p>

              <p className="mt-1 text-sm text-[#8A8578]">
                Get expiration reminders on your iPhone.
              </p>

              <button
                type="button"
                onClick={enablePushNotifications}
                disabled={registeringPush}
                className="mt-3 rounded-2xl bg-[#3F6B4F] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {registeringPush
                  ? "Enabling..."
                  : "Enable Push Notifications"}
              </button>

              {pushMessage && (
                <p className="mt-3 text-sm text-[#3F6B4F]">
                  {pushMessage}
                </p>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 font-semibold">
              Remind me
            </p>

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
            {saving
              ? "Saving..."
              : "Settings saved automatically."}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <Moon className="text-[#3F6B4F]" />
            <h2 className="font-serif text-2xl font-bold">
              Appearance
            </h2>
          </div>

          <p className="text-[#8A8578]">
            Dark mode coming soon.
          </p>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}