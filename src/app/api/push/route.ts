import { NextResponse } from "next/server";
import webpush from "web-push";
import { configureWebPush } from "@/lib/push-config";

// Route: /api/push
// Handles VAPID public key fetching and notification scheduling

export async function GET() {
  try {
    const keys = configureWebPush();
    return NextResponse.json({ publicKey: keys.publicKey });
  } catch (error: any) {
    console.error("Failed to configure Web Push / VAPID:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { subscription, delaySeconds, title, body } = await request.json();

    if (!subscription) {
      return NextResponse.json({ error: "Missing subscription object" }, { status: 400 });
    }

    const keys = configureWebPush();
    const delay = Number(delaySeconds) || 0;

    console.log(`G-End: Scheduling push notification in ${delay} seconds...`);
    console.log("Title:", title);
    console.log("Body:", body);

    // Schedule notification in the background using Node.js setTimeout
    setTimeout(async () => {
      try {
        const payload = JSON.stringify({
          title: title || "🛡️ G-End 防衛リマインダー",
          body: body || "対策グッズの交換期限が近づいています！",
          icon: "/favicon.ico",
          tag: "gend-push-alert"
        });

        await webpush.sendNotification(subscription, payload);
        console.log("G-End: Background push notification sent successfully!");
      } catch (err) {
        console.error("G-End: Failed to send background push notification:", err);
      }
    }, delay * 1000);

    return NextResponse.json({
      success: true,
      message: `Notification scheduled successfully. It will arrive in ${delay} seconds.`,
      scheduledSeconds: delay
    });
  } catch (error: any) {
    console.error("Failed to schedule background notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
