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

  // 3. テスト用のネイティブ風通知を今すぐ送る
  const triggerTestNotification = useCallback(() => {
    if (!isSupported) {
      alert("通知機能がサポートされていません。");
      return;
    }

    if (permission !== "granted") {
      alert("通知許可が与えられていません。まず通知を許可してください。");
      return;
    }

    // 保存された通知タイミング設定を取得して文言に連動
    const savedConfig = localStorage.getItem("bug_guard_notification_settings");
    let activeAlerts = ["当日", "3日前警告", "7日前警告"];
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        activeAlerts = [];
        if (config.notifyOnDay) activeAlerts.push("当日");
        if (config.notify3DaysBefore) activeAlerts.push("3日前");
        if (config.notify7DaysBefore) activeAlerts.push("7日前");
        if (config.notify30DaysBefore) activeAlerts.push("30日前");
      } catch {}
    }
    const alertsText = activeAlerts.length > 0 ? activeAlerts.join(", ") : "なし";

    // ネイティブ通知オプション
    const title = "BugGuard 防衛アラート";
    const options: any = {
      body: `対策グッズの交換期限が近づいています。設置マップを確認して交換してください。(有効な通知設定: ${alertsText})`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "bugguard-alert",
      requireInteraction: true,
      vibrate: [200, 100, 200],
    };

    // サービスワーカー経由、または直接表示
    if ("serviceWorker" in navigator && "showNotification" in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  }, [permission, isSupported]);

  // 4. 交換期限が迫った時のリマインダー通知をスケジュール（シミュレート）
  const scheduleReminder = useCallback((trapName: string, daysLeft: number) => {
    if (permission !== "granted") return;

    // ハッカソン・PWAデモ用のタイマーシミュレーション
    setTimeout(() => {
      const title = "BugGuard 交換リマインダー";
      const options: any = {
        body: `「${trapName}」の交換期限まで残り ${daysLeft} 日です。家全体の防衛効果を維持するために交換しましょう。`,
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
