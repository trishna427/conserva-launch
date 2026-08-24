import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { getKitchenSummary } from "@/lib/reminders";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayISO();

  const { data: preferences } = await supabaseAdmin
    .from("user_preferences")
    .select("*")
    .eq("email_reminders", true);

  let sentCount = 0;

  for (const preference of preferences || []) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
      preference.user_id
    );

    if (!userData.user?.email) continue;

    const { data: foods } = await supabaseAdmin
      .from("food_items")
      .select("*")
      .eq("user_id", preference.user_id)
      .eq("used", false)
      .eq("status", "active")
      .gte("expiration_date", today)
      .or(`last_reminder_sent.is.null,last_reminder_sent.neq.${today}`)
      .order("expiration_date", { ascending: true });

    if (!foods || foods.length === 0) continue;

    const summary = getKitchenSummary(foods, {
      in_app_reminders: true,
      days_before: preference.days_before,
    });

    if (summary.count === 0) continue;

    const reminderList = summary.reminders
      .map((reminder) => `<li>${reminder}</li>`)
      .join("");

    const { error: emailError } = await resend.emails.send({
      from: "Conserva <onboarding@resend.dev>",
      to: [userData.user.email],
      subject: "🌿 Your Conserva Kitchen Update",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>🌿 Your Conserva Kitchen Update</h2>
          <p>Good morning!</p>

          <p>
            You have <strong>${summary.count}</strong> food${
        summary.count === 1 ? "" : "s"
      } that may be best used soon.
          </p>

          <ul>
            ${reminderList}
          </ul>

          <p>
            Open Conserva to manage your kitchen and find recipe ideas.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Reminder email failed:", emailError);
      continue;
    }

    const foodIds = foods.map((food) => food.id);

    await supabaseAdmin
      .from("food_items")
      .update({ last_reminder_sent: today })
      .in("id", foodIds);

    sentCount++;
  }

  return NextResponse.json({
    success: true,
    sentCount,
  });
}