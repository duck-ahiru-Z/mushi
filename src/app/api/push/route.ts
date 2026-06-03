import { NextResponse } from "next/server";
import webpush from "web-push";
import { configureWebPush } from "@/lib/push-config";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";

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

    // 10秒以下の場合は、即時テストとしてレスポンスをブロックして送信（Vercel対応）
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
      } catch (err) {
        console.error("G-End: Failed to send push via serverless blocking wait:", err);
      }

      return NextResponse.json({
        success: true,
        message: `Notification sent after ${delay} seconds (serverless optimized).`,
      });
    }

    // 10秒を超える場合（例：1日後）はFirestoreに保存して、Vercel Cronに任せる
    const targetDate = new Date(Date.now() + delay * 1000);
    
    try {
      await addDoc(collection(db, "push_subscriptions"), {
        subscription,
        title: title || "🛡️ G-End 防衛リマインダー",
        body: body || "対策グッズの交換期限が近づいています！",
        targetDate: targetDate.toISOString(), // クエリしやすいようにISO文字列で保存
        createdAt: new Date().toISOString(),
      });
      console.log(`G-End: Saved scheduled push to Firestore. Target: ${targetDate.toISOString()}`);
    } catch (err) {
      console.error("G-End: Failed to save subscription to Firestore:", err);
      throw new Error("Failed to save to database");
    }

    return NextResponse.json({
      success: true,
      message: `Notification scheduled successfully for ${targetDate.toLocaleString()}.`,
    });
  } catch (error: any) {
    console.error("Failed to schedule background notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

