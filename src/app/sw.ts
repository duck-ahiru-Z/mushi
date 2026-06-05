/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// --- 1. SerwistによるPWAオフラインキャッシュ設定 ---
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// --- 2. G-End: Web Push イベントリスナー ---
self.addEventListener("push", (event) => {
  console.log("G-End Service Worker: Push message received", event);
  
  let data = {
    title: "🛡️ G-End 対策アラート",
    body: "対策グッズの交換期限が到来しました！",
    icon: "/favicon.ico",
    tag: "gend-push-alert",
    url: "/"
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
      url: data.url || "/"
    },
    actions: [
      { action: "explore", title: "アプリを開いて確認", icon: "/favicon.ico" },
      { action: "close", title: "閉じる" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "G-End", options)
  );
});

// 通知をクリックした時の挙動
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  // アプリを開く、またはタブにフォーカスする
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
