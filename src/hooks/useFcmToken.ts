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
  // 3. テスト用のネイティブ風通知を今すぐ送る
  const triggerTestNotification = useCallback(async () => {
    if (!isSupported) {
      alert("お使いのブラウザやデバイスは、ウェブプッシュ通知機能に対応していません。");
      return;
    }

    let currentPermission = permission;
    if (currentPermission !== "granted") {
      // 未許可の場合は、自動的に許可を求めるプロンプトを起動！
      const result = await requestNotificationPermission();
      currentPermission = result;
      if (result !== "granted") {
        alert("通知が許可されなかったため、テスト通知を送信できませんでした。ブラウザの設定から通知を許可してください。");
        return;
      }
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
    const title = "G-End 防衛通知テスト";
    const options: any = {
      body: `期限切れ警告のリマインダー通知は正常に動作しています！(通知スケジュール: ${alertsText})`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "g-end-alert-test",
      requireInteraction: true,
      vibrate: [200, 100, 200],
    };

    // サービスワーカー経由、または直接表示 (SW準備未完了時は即座にネイティブ表示にフォールバックして確実に発火させる)
    const fireNotification = () => {
      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready
            .then((registration) => {
              registration.showNotification(title, options).catch((err) => {
                console.warn("SW showNotification failed, using native:", err);
                new Notification(title, options);
              });
            })
            .catch((err) => {
              console.warn("SW ready failed, using native:", err);
              new Notification(title, options);
            });
        } else {
          new Notification(title, options);
        }
      } catch (err) {
        console.error("Notification fallback failed:", err);
        try {
          new Notification(title, options);
        } catch (e) {
          alert("通知の送信に失敗しました。ブラウザの設定で通知がブロックされていないかご確認ください。");
        }
      }
    };

    fireNotification();
  }, [permission, isSupported, requestNotificationPermission]);

  // 4. 交換期限が迫った時のリマインダー通知をスケジュール（シミュレート）
  const scheduleReminder = useCallback((trapName: string, daysLeft: number) => {
    if (permission !== "granted") return;

    // ハッカソン・PWAデモ用のタイマーシミュレーション
    setTimeout(() => {
      const title = "G-End 交換リマインダー";
      const options: any = {
        body: `「${trapName}」の交換期限まで残り ${daysLeft} 日です。家全体の防衛効果を維持するために交換しましょう。`,
        icon: "/favicon.ico",
        tag: "g-end-reminder",
        vibrate: [100, 50, 100],
      };
      
      if ("serviceWorker" in navigator && "showNotification" in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
      } else {
        new Notification(title, options);
      }
    }, 8000); // 8秒後にデモ通知
  }, [permission]);

  // 5. バックグラウンド用（閉じていても届く）の通知スケジュール
  const scheduleBackgroundNotification = useCallback(async (delaySeconds: number, title: string, body: string) => {
    if (!isSupported) {
      alert("お使いのブラウザやデバイスはプッシュ通知に対応していません。");
      return false;
    }

    let currentPermission = permission;
    if (currentPermission !== "granted") {
      const result = await requestNotificationPermission();
      currentPermission = result;
      if (result !== "granted") {
        alert("通知許可が得られなかったため、スケジュールできませんでした。");
        return false;
      }
    }

    try {
      // 1. 公開キーをサーバーから取得
      const keyRes = await fetch("/api/push");
      const { publicKey } = await keyRes.json();

      if (!publicKey) {
        throw new Error("VAPID public key not generated");
      }

      // 2. サービスワーカーが準備できているか確認
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker is not supported by this browser");
      }

      const registration = await navigator.serviceWorker.ready;
      
      // 3. プッシュ通知への登録（購読）
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // 4. バックグラウンドサーバーへ送信してスケジュール
      const scheduleRes = await fetch("/api/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscription,
          delaySeconds,
          title,
          body
        })
      });

      const resData = await scheduleRes.json();
      if (resData.success) {
        return true;
      } else {
        throw new Error(resData.error || "Failed to schedule on server");
      }
    } catch (error: any) {
      console.error("G-End scheduleBackgroundNotification error:", error);
      alert("スケジュール通知設定中にエラーが発生しました: " + error.message);
      return false;
    }
  }, [permission, isSupported, requestNotificationPermission]);

  return {
    permission,
    token,
    isSupported,
    loading,
    requestNotificationPermission,
    triggerTestNotification,
    scheduleReminder,
    scheduleBackgroundNotification,
  };
}

// Utility to convert Base64 VAPID public key to Uint8Array required by PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

