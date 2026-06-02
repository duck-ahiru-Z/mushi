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

    // 10秒以下の場合は、サーバーレス環境（Vercel等）のコールドスタート・即時終了対策として、
    // HTTPレスポンスを返す前にスリープ待機して確実に送信処理を実行させます。
    if (delay <= 10) {
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      try {
        const payload = JSON.stringify({
          title: title || "🛡️ G-End 防衛リマインダー",
          body: body || "対策グッズの交換期限が近づいています！",
          icon: "/favicon.ico",
          tag: "gend-push-alert"
        });

        await webpush.sendNotification(subscription, payload);
        console.log("G-End: Sent push via serverless blocking wait successfully!");
      } catch (err) {
        console.error("G-End: Failed to send push via serverless blocking wait:", err);
      }

      return NextResponse.json({
        success: true,
        message: `Notification sent after ${delay} seconds (serverless optimized).`,
        scheduledSeconds: delay
      });
    }

    // 10秒を超える場合は、通常のバックグラウンド setTimeout でスケジュール（常時稼働サーバー用）
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
