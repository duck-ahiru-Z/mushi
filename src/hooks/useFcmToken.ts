"use client";
import { useState, useEffect, useCallback } from "react";

export function useFcmToken() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. 通知機能のサポート状況の確認とパーミッション取得の確認
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // 保存済みのFCM/モックトークンがあるかチェック
      const savedToken = localStorage.getItem("fcm_token");
      if (savedToken) {
        setToken(savedToken);
      }
    }
  }, []);

  // 2. 通知の許可リクエスト
  const requestNotificationPermission = useCallback(async () => {
    if (!isSupported) {
      alert("お使いのブラウザ・端末はプッシュ通知に対応していません。");
      return "default";
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        // FCMトークンの登録（シミュレーション・もしくは実機生成）
        // クラウドメッセージングに送信するためのトークンキーを作成
        const mockToken = "fcm_token_bg_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
        localStorage.setItem("fcm_token", mockToken);
        setToken(mockToken);
        
        // PWAサービスワーカーの登録チェック
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            console.log("Service Worker is ready for notifications", registration);
          });
        }
      }
      return result;
    } catch (error) {
      console.error("Failed to request permission:", error);
      return "default";
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  // 3. テスト用のネイティブ風通知を今すぐ送る (ネイティブアプリ体験)
  const triggerTestNotification = useCallback(() => {
    if (!isSupported) {
      alert("通知機能がサポートされていません。");
      return;
    }

    if (permission !== "granted") {
      alert("通知許可がまだ与えられていません。まず「通知を許可」ボタンを押してください。");
      return;
    }

    // ネイティブ通知オプション
    const title = "🛡️ BugGuard 防衛アラート";
    const options: NotificationOptions = {
      body: "【警告】ゴキブリホイホイの交換期限（あと7日）が近づいています！設置マップを確認してください。",
      icon: "/favicon.ico", // 実装上のプレースホルダー、アイコン指定
      badge: "/favicon.ico",
      tag: "bugguard-alert",
      requireInteraction: true, // ユーザーが閉じるまで表示し続ける
      vibrate: [200, 100, 200], // スマホでのバイブパターン
    };

    // サービスワーカー経由、または直接表示
    if ("serviceWorker" in navigator && "showNotification" in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } else {
      // フォールバック
      new Notification(title, options);
    }
  }, [permission, isSupported]);

  // 4. 交換期限が迫った時のリマインダー通知をスケジュール（シミュレート）
  const scheduleReminder = useCallback((trapName: string, daysLeft: number) => {
    if (permission !== "granted") return;

    // ハッカソン・PWAデモ用のタイマーシミュレーション
    // 実際にはサーバーまたは Service Worker の同期機能で送信されますが、
    // ここでは10秒後にリマインダーが届く「擬似体験タイマー」を仕掛けることができます
    setTimeout(() => {
      const title = "⏰ 防衛グッズの交換リマインダー";
      const options: NotificationOptions = {
        body: `「${trapName}」の回収期限まで残り ${daysLeft} 日です。家全体の防衛効果が弱まる前に交換しましょう！`,
        icon: "/favicon.ico",
        tag: "bugguard-reminder",
        vibrate: [100, 50, 100],
      };
      
      if ("serviceWorker" in navigator && "showNotification" in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
      } else {
        new Notification(title, options);
      }
    }, 8000); // 8秒後にデモ通知
  }, [permission]);

  return {
    permission,
    token,
    isSupported,
    loading,
    requestNotificationPermission,
    triggerTestNotification,
    scheduleReminder,
  };
}
