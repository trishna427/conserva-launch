
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import apn from "@parse/node-apn";
import {
  getFoodsNeedingReminders,
  getKitchenSummary,
} from "@/lib/reminders";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const today = todayISO();

  const { data: preferences, error: preferencesError } =
    await supabaseAdmin
      .from("user_preferences")
      .select("*");

  if (preferencesError) {
    console.error(
      "Could not load reminder preferences:",
      preferencesError
    );

    return NextResponse.json(
      { error: "Could not load reminder preferences" },
      { status: 500 }
    );
  }

  let emailSentCount = 0;
  let pushSentCount = 0;

  const hasAPNsCredentials = Boolean(
    process.env.APNS_PRIVATE_KEY &&
      process.env.APNS_KEY_ID &&
      process.env.APNS_TEAM_ID
  );

  const provider = hasAPNsCredentials
    ? new apn.Provider({
        token: {
          key: process.env.APNS_PRIVATE_KEY!.replace(
            /\\n/g,
            "\n"
          ),
          keyId: process.env.APNS_KEY_ID!,
          teamId: process.env.APNS_TEAM_ID!,
        },

        // Your current iPhone app was installed from Xcode.
        // Change this for production/TestFlight delivery later.
        production: false,
      })
    : null;

  try {
    for (const preference of preferences || []) {
      const { data: foods, error: foodsError } =
        await supabaseAdmin
          .from("food_items")
          .select("*")
          .eq("user_id", preference.user_id)
          .eq("used", false)
          .eq("status", "active")
          .gte("expiration_date", today)
          .order("expiration_date", {
            ascending: true,
          });

      if (foodsError) {
        console.error(
          "Could not load foods for user:",
          preference.user_id,
          foodsError
        );
        continue;
      }

      if (!foods?.length) continue;

      const reminderPreferences = {
        in_app_reminders: true,
        days_before: preference.days_before,
      };

      const reminderFoods = getFoodsNeedingReminders(
        foods,
        reminderPreferences
      );

      if (reminderFoods.length === 0) continue;

      const summary = getKitchenSummary(
        reminderFoods,
        reminderPreferences
      );

      // ------------------------------------
      // EMAIL REMINDERS
      // ------------------------------------

      if (preference.email_reminders) {
        const emailFoods = reminderFoods.filter(
          (food) => food.last_reminder_sent !== today
        );

        if (emailFoods.length > 0) {
          const { data: userData, error: userError } =
            await supabaseAdmin.auth.admin.getUserById(
              preference.user_id
            );

          if (userError) {
            console.error(
              "Could not load email recipient:",
              userError
            );
          } else if (userData.user?.email) {
            const emailSummary = getKitchenSummary(
              emailFoods,
              reminderPreferences
            );

            const reminderList =
              emailSummary.reminders
                .map(
                  (reminder) =>
                    `<li>${escapeHtml(reminder)}</li>`
                )
                .join("");

            const { error: emailError } =
              await resend.emails.send({
                from:
                  "Conserva <onboarding@resend.dev>",
                to: [userData.user.email],
                subject:
                  "Your Conserva Kitchen Update",
                html: `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Your Conserva Kitchen Update</h2>

                    <p>Good morning!</p>

                    <p>
                      You have
                      <strong>${emailSummary.count}</strong>
                      food${
                        emailSummary.count === 1
                          ? ""
                          : "s"
                      }
                      that may be best used soon.
                    </p>

                    <ul>
                      ${reminderList}
                    </ul>

                    <p>
                      Open Conserva to manage your kitchen
                      and find recipe ideas.
                    </p>
                  </div>
                `,
              });

            if (emailError) {
              console.error(
                "Reminder email failed:",
                emailError
              );
            } else {
              const foodIds = emailFoods.map(
                (food) => food.id
              );

              const { error: updateError } =
                await supabaseAdmin
                  .from("food_items")
                  .update({
                    last_reminder_sent: today,
                  })
                  .in("id", foodIds);

              if (updateError) {
                console.error(
                  "Could not update email reminder dates:",
                  updateError
                );
              }

              emailSentCount++;
            }
          }
        }
      }

      // ------------------------------------
      // PUSH REMINDERS
      // Independent of email/in-app settings
      // ------------------------------------

      if (!provider) continue;

      const { data: devices, error: devicesError } =
        await supabaseAdmin
          .from("push_tokens")
          .select("token")
          .eq("user_id", preference.user_id)
          .eq("platform", "ios");

      if (devicesError) {
        console.error(
          "Could not load push devices:",
          devicesError
        );
        continue;
      }

      if (!devices?.length) continue;

      // Claim today's reminder before sending so
      // overlapping cron runs do not send duplicates.
      const { error: logError } =
        await supabaseAdmin
          .from("push_reminder_log")
          .insert({
            user_id: preference.user_id,
            sent_date: today,
          });

      if (logError) {
        // A row already exists if this user was
        // processed earlier today.
        if (logError.code !== "23505") {
          console.error(
            "Could not create push reminder log:",
            logError
          );
        }

        continue;
      }

      let successfulDevices = 0;

      try {
        const notification = new apn.Notification();

        notification.topic = "com.conserva.app";
        notification.sound = "default";

        notification.alert = {
          title: "Your Conserva Kitchen Update",
          body:
            summary.count === 1
              ? `${summary.reminders[0]}`
              : `${summary.count} foods are ready to use soon. Open Conserva to check your kitchen.`,
        };

        const result = await provider.send(
          notification,
          devices.map((device) => device.token)
        );

        successfulDevices = result.sent.length;

        for (const failure of result.failed) {
          console.error(
            "Push notification failed:",
            failure.status,
            failure.response?.reason
          );
        }

        pushSentCount += successfulDevices;
      } catch (error) {
        console.error(
          "Push reminder failed:",
          error
        );
      }

      // If Apple accepted none of the notifications,
      // remove the claim so a later run can retry.
      if (successfulDevices === 0) {
        const { error: deleteError } =
          await supabaseAdmin
            .from("push_reminder_log")
            .delete()
            .eq("user_id", preference.user_id)
            .eq("sent_date", today);

        if (deleteError) {
          console.error(
            "Could not clear failed push reminder log:",
            deleteError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailSentCount,
      pushSentCount,
    });
  } finally {
    provider?.shutdown();
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}