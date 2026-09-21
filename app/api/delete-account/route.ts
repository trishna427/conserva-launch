import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration is missing." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const token = authorization.slice("Bearer ".length);

    // Verify the signed-in user before allowing deletion.
    const supabase = createClient(supabaseUrl, anonKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    // Admin access stays on the server.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete account-owned data first.
    const tables = [
      "push_reminder_log",
      "push_tokens",
      "recipes",
      "food_items",
      "user_preferences",
    ];

    for (const table of tables) {
      const { error } = await admin
        .from(table)
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error(
          `Failed to delete ${table} for user ${user.id}:`,
          error.message
        );

        return NextResponse.json(
          {
            error:
              "We couldn't finish deleting your account data. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    // Delete the Supabase Auth account last.
    const { error: deleteError } =
      await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Account deletion failed:", deleteError.message);

      return NextResponse.json(
        {
          error:
            "We couldn't finish deleting your account. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}