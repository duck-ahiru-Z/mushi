import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layouts/bottom-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "G-End",
  description: "虫よけグッズの期限切れを間取りマップとプッシュ通知で防ぐアプリ",
  manifest: "/manifest.json", // PWA用のマニフェスト紐付け
};

import Link from "next/link";

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
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased`}>
        {/* PC用ヘッダーナビゲーション */}
        <header className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <span className="text-xl font-black text-teal-600 tracking-tight flex items-center gap-1.5 select-none">
                G-End
              </span>
              <nav className="flex items-center gap-6 text-sm font-bold text-slate-500">
                <Link href="/" className="hover:text-teal-600 transition-colors py-2">ホーム</Link>
                <Link href="/map" className="hover:text-teal-600 transition-colors py-2">配置マップ</Link>
                <Link href="/encyclopedia" className="hover:text-teal-600 transition-colors py-2">対策図鑑</Link>
                <Link href="/register" className="hover:text-teal-600 transition-colors py-2">アカウント連携</Link>
              </nav>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
              防衛システム稼働中
            </div>
          </div>
        </header>

        {/* メインコンテンツエリア */}
        <main className="flex-1 w-full max-w-md md:max-w-5xl mx-auto bg-white md:shadow-xl md:rounded-3xl md:my-6 md:border md:border-slate-100 min-h-screen md:min-h-[calc(100vh-8rem)] flex flex-col overflow-hidden pb-16 md:pb-0">
          {children}
        </main>

        {/* スマホ用ボトムナビゲーションバー */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}