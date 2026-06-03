import { NextResponse } from "next/server";
import webpush from "web-push";
import { configureWebPush } from "@/lib/push-config";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function GET(request: Request) {
  // 注意: 実際の運用環境では、Authorizationヘッダーを利用して
  // Vercel Cronからのリクエストであることを検証する仕組みを導入することをお勧めします。
  /*
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  */

  try {
    configureWebPush();
    const nowISO = new Date().toISOString();
    
    // push_subscriptions コレクションを全件取得（件数が増えた場合はクエリで絞り込む）
    const snapshot = await getDocs(collection(db, "push_subscriptions"));
    let sentCount = 0;
    const deletePromises: Promise<void>[] = [];

    for (const document of snapshot.docs) {
      const data = document.data();
      
      // targetDateが存在し、現在時刻を過ぎている場合は通知を送信
      if (data.targetDate && data.targetDate <= nowISO) {
        if (data.subscription) {
          const payload = JSON.stringify({
            title: data.title || "🛡️ G-End 防衛リマインダー",
            body: data.body || "対策グッズの交換期限が到来しました！",
            icon: "/favicon.ico",
            tag: "gend-push-alert"
          });

          try {
            await webpush.sendNotification(data.subscription, payload);
            console.log(`Cron: Successfully sent push to doc ${document.id}`);
            sentCount++;
          } catch (err: any) {
            console.error(`Cron: Failed to send push for doc ${document.id}:`, err);
            // 410 Gone はサブスクリプションが無効（ユーザーがブロックした等）なので削除対象
            if (err.statusCode === 410) {
              console.log(`Cron: Subscription expired/invalid for doc ${document.id}. It will be deleted.`);
            }
          }
        }
        // 送信済み（またはエラー）のドキュメントは削除して重複を防ぐ
        deletePromises.push(deleteDoc(doc(db, "push_subscriptions", document.id)));
      }
    }

    await Promise.all(deletePromises);

    return NextResponse.json({
      success: true,
      message: `Cron executed successfully. Sent ${sentCount} notifications. Deleted ${deletePromises.length} documents.`,
    });
  } catch (error: any) {
    console.error("Cron failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
