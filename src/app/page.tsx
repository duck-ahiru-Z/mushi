"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trap } from "@/types/trap";
import { fetchTraps } from "@/lib/firebase/firestore";

export default function HomePage() {
  const [traps, setTraps] = useState<Trap[]>([]);
  const [location, setLocation] = useState<string>("位置情報：未取得");
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 5月（現在のシーズン）

  // 1. 起動時にグッズ一覧を取得
  useEffect(() => {
    const loadTraps = async () => {
      const data = await fetchTraps(null); // ゲストモード（null）
      setTraps(data);
    };
    loadTraps();
  }, []);

  // 2. ブラウザの機能で位置情報（都道府県レベル）を取得する関数
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("お使いのブラウザは位置情報に対応していません");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // ハッカソン版ショートカット：本来は逆ジオコーディングAPIを叩きますが、
        // 今回は位置情報が取れたらデモ用に「和歌山県」に設定します
        setLocation("📍 和歌山県（位置情報から取得）");
        setLoadingLocation(false);
      },
      (error) => {
        console.error(error);
        setLocation("📍 近畿エリア（デフォルト）");
        setLoadingLocation(false);
      }
    );
  };

  // 3. 期限が迫っている（あと7日以内）グッズをフィルタリング
  const alertTraps = traps.filter((trap) => {
    if (!trap.isActive) return false;
    const diffTime = new Date(trap.expirationDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // 7日以内
  });

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-50">
      {/* ヘッダーエリア */}
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <div>
          <h1 className="text-2xl font-black text-teal-600 tracking-tight">BugGuard</h1>
          <p className="text-xs text-slate-400">2026年 {currentMonth}月 シーズン</p>
        </div>
        <button
          onClick={handleGetLocation}
          disabled={loadingLocation}
          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-medium"
        >
          {loadingLocation ? "取得中..." : location}
        </button>
      </div>

      {/* 4. 天気・季節連動型の「リアルタイム虫予報アラート」 */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 text-orange-800 p-4 rounded-2xl shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⚠️</span>
          <h2 className="font-bold text-sm text-orange-950">【注意】ゴキブリ・蚊の活動期に突入</h2>
        </div>
        <p className="text-xs text-orange-900 leading-relaxed">
          現在の気温が25度を超えました。湿度の高いキッチンや洗面所で害虫が活発化しています。今すぐ対策グッズの配置を確認してください！
        </p>
        <Link href="/encyclopedia" className="inline-block mt-3 text-xs font-bold text-orange-700 hover:underline">
          対策図鑑で有効な置き方を見る →
        </Link>
      </div>

      {/* 5. 期限間近の通知アラートエリア */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-500 mb-2">🚨 要交換（期限切れ間近）</h2>
        {alertTraps.length === 0 ? (
          <div className="bg-white p-4 rounded-xl text-center border border-slate-100 shadow-sm text-xs text-slate-400">
            現在、期限が切れているグッズはありません。あひる
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alertTraps.map((trap) => (
              <div key={trap.id} className="bg-red-50 border border-red-100 p-3 rounded-xl flex justify-between items-center shadow-sm animate-pulse">
                <div>
                  <p className="text-xs font-bold text-red-950">{trap.name}</p>
                  <p className="text-[11px] text-red-700">場所: {trap.placedLocation}</p>
                </div>
                <span className="text-xs font-black text-red-600 bg-white px-2 py-1 rounded-md border border-red-200">
                  要交換！
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. 配置中のグッズ簡易ステータス */}
      <div className="flex-1">
        <h2 className="text-sm font-bold text-slate-500 mb-2">🏡 現在の防衛状況 ({traps.length}個設置中)</h2>
        {traps.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 mb-3">まだ対策グッズが配置されていません</p>
            <Link href="/map" className="inline-block bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow">
              マップを開いて配置する
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y overflow-hidden">
            {traps.map((trap) => (
              <div key={trap.id} className="p-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{trap.name}</p>
                  <p className="text-slate-400 text-[11px]">{trap.placedLocation}</p>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">
                  期限: {trap.expirationDate}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}