import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, reminders } = body as {
      email: string;
      reminders: string[];
    };

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json(
        { error: "No reminders to send" },
        { status: 400 }
      );
    }

    const reminderList = reminders
      .map((item) => `<li>${item}</li>`)
      .join("");

    const { data, error } = await resend.emails.send({
      from: "Conserva <onboarding@resend.dev>",
      to: [email],
      subject: "🌿 Your Conserva Kitchen Update",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>🌿 Your Conserva Kitchen Update</h2>

          <p>Good morning!</p>

          <p>You have <strong>${reminders.length}</strong> food${
        reminders.length === 1 ? "" : "s"
      } that may be best used soon.</p>

          <ul>
            ${reminderList}
          </ul>

          <p>Open Conserva to manage your kitchen and find recipe ideas.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}