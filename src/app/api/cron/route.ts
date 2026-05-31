import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Trap } from "@/types/trap";

// Vercel Cron / API Route Handler: 毎日深夜に実行される想定の期限アラートAPI
// 例: Vercel.json等にスケジュール定義して定期実行させます
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    // 本番環境セキュリティ：Vercel Cronの秘密キー検証（デモのためスキップ可能に）
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trapsRef = collection(db, "traps");
    // アクティブなトラップのみ抽出
    const q = query(trapsRef, where("isActive", "==", true));
    const querySnapshot = await getDocs(q);

    const today = new Date();
    const notifyingTraps: Trap[] = [];

    querySnapshot.forEach((docSnap) => {
      const trap = docSnap.data() as Trap;
      const expDate = new Date(trap.expirationDate);
      
      // 期限までの残り日数
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 期限切れ、または残り7日以内のものを選出
      if (diffDays <= 7) {
        notifyingTraps.push(trap);
      }
    });

    // 本番環境シミュレーション：ここでFCM Admin SDKや外部APIを使用して通知トークン（user.fcmTokens）宛てにPush通知を送信します。
    console.log(`[G-End Cron] 期限切れ間近のグッズを ${notifyingTraps.length} 個検出しました。`);
    
    notifyingTraps.forEach((trap) => {
      console.log(`FCM送信シミュレーション: [ユーザー: ${trap.userId || "ゲスト"}] -> 「${trap.name}」期限: ${trap.expirationDate}`);
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkedCount: querySnapshot.size,
      alertCount: notifyingTraps.length,
      notifiedTraps: notifyingTraps.map((t) => ({ id: t.id, name: t.name, expirationDate: t.expirationDate })),
    });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
