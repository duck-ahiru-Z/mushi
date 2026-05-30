// PWA Web Push Background Notification Service Worker
// このサービスワーカーはバックグラウンドでサーバーから受信したPush通知を端末へ表示します。

self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("BugGuard Service Worker: Installed successfully");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  console.log("BugGuard Service Worker: Activated successfully");
});

// バックグラウンドプッシュメッセージの受信リスナー
self.addEventListener("push", (event) => {
  console.log("BugGuard Service Worker: Push message received", event);
  
  let data = {
    title: "🛡️ BugGuard 防衛アラート",
    body: "対策グッズの交換期限が到来しました！",
    icon: "/favicon.ico",
    tag: "bugguard-push-alert"
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1"
    },
    actions: [
      {
        action: "explore",
        title: "アプリを開いて確認",
        icon: "/favicon.ico"
      },
      {
        action: "close",
        title: "閉じる"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知をクリックした時の挙動
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "close") {
    return;
  }

  // アプリを開く、またはタブにフォーカスする
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
