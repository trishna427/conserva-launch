
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import apn from "@parse/node-apn";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const key = process.env.APNS_PRIVATE_KEY;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;

  if (!key || !keyId || !teamId) {
    return NextResponse.json(
      { error: "Missing APNs credentials" },
      { status: 500 }
    );
  }

  const { data: devices, error } = await supabaseAdmin
    .from("push_tokens")
    .select("token")
    .eq("platform", "ios")
    .limit(1);

  if (error) {
    return NextResponse.json(
      { error: "Could not load device token" },
      { status: 500 }
    );
  }

  if (!devices?.length) {
    return NextResponse.json(
      { error: "No registered iPhone found" },
      { status: 404 }
    );
  }

  const provider = new apn.Provider({
    token: {
      key: key.replace(/\\n/g, "\n"),
      keyId,
      teamId,
    },
    production: false,
  });

  try {
    const notification = new apn.Notification();

    notification.topic = "com.conserva.app";
    notification.alert = {
      title: "Conserva Test",
      body: "Your first push notification is working!",
    };
    notification.sound = "default";

    const result = await provider.send(
      notification,
      devices[0].token
    );

    return NextResponse.json({
      sent: result.sent.length,
      failed: result.failed.map((failure) => ({
        status: failure.status,
        reason: failure.response?.reason ?? "Unknown error",
      })),
    });
  } catch (error) {
    console.error("APNs test failed:", error);

    return NextResponse.json(
      { error: "Push notification test failed" },
      { status: 500 }
    );
  } finally {
    provider.shutdown();
  }
}