import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layouts/bottom-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BugGuard",
  description: "虫よけグッズの期限切れを間取りマップとプッシュ通知で防ぐアプリ",
  manifest: "/manifest.json", // PWA用のマニフェスト紐付け
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* スマホでピンチイン・アウト（ズーム）してレイアウトが崩れるのを防ぐ設定 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col pb-16 antialiased`}>
        {/* メインコンテンツエリア */}
        <main className="flex-1 w-full max-w-md mx-auto bg-white shadow-md min-h-screen overflow-y-auto">
          {children}
        </main>

        {/* スマホ用ボトムナビゲーションバー */}
        <BottomNav />
      </body>
    </html>
  );
}