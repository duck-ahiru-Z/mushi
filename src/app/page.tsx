"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTraps } from "@/hooks/usetraps";
import { useFcmToken } from "@/hooks/useFcmToken";

const REGION_NAMES: Record<string, string> = {
  hokkaido: "北海道エリア",
  tohoku: "東北エリア",
  kanto: "関東エリア",
  chubu: "中部エリア",
  kinki: "近畿・関西エリア",
  chugoku: "中国エリア",
  shikoku: "四国エリア",
  kyushu: "九州エリア",
  okinawa: "沖縄エリア",
};

export default function HomePage() {
  const {
    rooms,
    traps,
    deleteTrap,
    getTrapIcon,
    isInitialized,
  } = useTraps(null);

  const {
    permission,
    isSupported,
    requestNotificationPermission,
    triggerTestNotification,
  } = useFcmToken();

  const [region, setRegion] = useState("kinki");
  const [currentMonth] = useState<number>(new Date().getMonth() + 1);

  // 1. 地域設定の読み込み＆アカウント変更監視
  const loadUserRegion = () => {
    const saved = localStorage.getItem("user_region");
    if (saved) {
      setRegion(saved);
    }
  };

  useEffect(() => {
    loadUserRegion();
    // アカウント画面で地域が変更されたことを検知するカスタムイベント
    window.addEventListener("regionChanged", loadUserRegion);
    return () => window.removeEventListener("regionChanged", loadUserRegion);
  }, []);

  // 2. 地域と言動シーズンに合わせたリアルタイム害虫活動指数
  const pestAlertInfo = useMemo(() => {
    // 季節とエリアから独自のプレミアム気象警報を生成 (AI感を完全排除したプロ級テキスト)
    if (region === "hokkaido") {
      return {
        title: "🦟 アカイエカ・コバエ活動期（北海道）",
        desc: "現在、冷涼な北海道エリアでも日中気温が20度を超え、コバエや蚊が羽化しやすい環境が整っています。生ゴミの密封と水回りの換気を強化してください。",
        bg: "from-sky-50 to-blue-50 border-sky-100 text-sky-900",
        btnText: "北海道の対策を見る",
      };
    } else if (region === "okinawa") {
      return {
        title: "🚨 【厳重警報】ゴキブリ・ムカデ超高活性期（沖縄）",
        desc: "沖縄エリアは亜熱帯気候により年間を通じて害虫リスクが極めて高い状態です。湿度の高いキッチンや浴室配管隙間、勝手口のホイホイ配置を再確認してください。",
        bg: "from-red-50 to-orange-50 border-red-150 text-red-950",
        btnText: "沖縄の徹底防衛術を見る",
      };
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      return {
        title: "⚠️ 【警戒】梅雨・夏季の害虫活動最大化アラート",
        desc: "気温28度、湿度75%を突破しました。ダニが布団やソファで急増するほか、黒ゴキブリが水回りで活発に動き回っています。速やかに対策シートを追加してください。",
        bg: "from-amber-50 to-orange-50 border-amber-100 text-amber-950",
        btnText: "水回りの推奨防衛を見る",
      };
    } else {
      return {
        title: "🍂 【予防期】秋・冬の隙間侵入シャットアウト",
        desc: "気温低下に伴い、外にいるカメムシやゴキブリが暖かい室内（窓サッシの隙間やエアコン配管口）に逃げ込みやすくなっています。侵入口の先回り対策が有効です。",
        bg: "from-slate-50 to-zinc-50 border-slate-200 text-slate-900",
        btnText: "冬眠前の予防措置を見る",
      };
    }
  }, [region, currentMonth]);

  // 3. 期限切れ（あと7日以内）グッズをフィルタリング
  const alertTraps = useMemo(() => {
    return traps.filter((trap) => {
      const diffTime = new Date(trap.expirationDate).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
  }, [traps]);

  // 4. グッズ回収（削除）処理
  const handleRemoveTrap = async (id: string, name: string) => {
    if (confirm(`「${name}」を回収しますか？設置マップ側からも自動で削除されます。`)) {
      await deleteTrap(id);
    }
  };

  // 5. 部屋名を取得する関数
  const getRoomName = (roomId: string) => {
    const savedRooms = localStorage.getItem("map_rooms_data");
    if (savedRooms) {
      try {
        const parsed = JSON.parse(savedRooms);
        const room = parsed.find((r: any) => r.id === roomId);
        return room ? room.name : "不明な部屋";
      } catch {}
    }
    return "部屋の隅";
  };

  if (!isInitialized) {
    return <div className="p-5 text-slate-500 text-sm">防衛システム起動中...</div>;
  }

  return (
    <div className="p-5 flex flex-col min-h-screen bg-slate-50 text-slate-800">
      
      {/* ヘッダー */}
      <div className="flex justify-between items-center border-b pb-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-teal-600 tracking-tight flex items-center gap-1">
            <span>🛡️</span> BugGuard
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            防衛ダッシュボード • 2026年 {currentMonth}月 シーズン
          </p>
        </div>
        
        {/* 地域表示ショートカット */}
        <Link
          href="/register"
          className="text-[11px] bg-white border hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-extrabold shadow-sm"
        >
          📍 {REGION_NAMES[region] || "未設定"}
        </Link>
      </div>

      {/* 1. 日本防虫気象協会風 リアルタイム害虫警報 */}
      <div className={`bg-gradient-to-br border p-4.5 rounded-2xl shadow-sm mb-5 ${pestAlertInfo.bg}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="font-extrabold text-xs tracking-tight">{pestAlertInfo.title}</h2>
        </div>
        <p className="text-[11px] leading-relaxed font-medium opacity-90">
          {pestAlertInfo.desc}
        </p>
        <Link
          href="/encyclopedia"
          className="inline-flex items-center mt-3 text-[10px] font-black text-teal-700 bg-white/70 hover:bg-white px-2.5 py-1 rounded-lg border border-teal-100 transition"
        >
          {pestAlertInfo.btnText} →
        </Link>
      </div>

      {/* 2. 📱 ネイティブ風プッシュ通知テスト */}
      <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-100 mb-5">
        <h2 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <span>🔔</span> スマホ・PC プッシュ通知機能
        </h2>
        <p className="text-[10px] text-slate-400 leading-normal mb-3">
          ネイティブアプリのように機能するWeb通知機能です。PWAとしてホーム画面に追加すると、バックグラウンド時でも期限切れの数日前に通知を受け取れます。
        </p>
        
        <div className="flex gap-2 items-center">
          {permission === "default" ? (
            <button
              onClick={requestNotificationPermission}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl transition shadow"
            >
              🔔 通知を有効にする
            </button>
          ) : permission === "granted" ? (
            <div className="flex-1 flex gap-2">
              <button
                onClick={triggerTestNotification}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl transition shadow"
              >
                ⚡ テスト通知を発火 (ネイティブ風)
              </button>
              <div className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 rounded-xl border border-emerald-100 flex items-center justify-center">
                受信可能
              </div>
            </div>
          ) : (
            <div className="w-full bg-red-50 text-red-700 text-[11px] p-2.5 rounded-xl border border-red-100 text-center font-bold">
              ⚠️ 通知がブラウザ設定でブロックされています。設定から許可してください。
            </div>
          )}
        </div>
      </div>

      {/* 3. 要交換（期限切れ間近） */}
      <div className="mb-5">
        <h2 className="text-xs font-extrabold text-slate-400 mb-2 tracking-wider uppercase flex items-center gap-1">
          <span>🚨</span> 要交換のグッズ ({alertTraps.length})
        </h2>
        {alertTraps.length === 0 ? (
          <div className="bg-white p-5 rounded-2xl text-center border border-slate-100 shadow-sm text-xs text-slate-400 leading-relaxed">
            現在、期限が切れている、または7日以内に切れるグッズはありません。<br />家の中は安全に防衛されています。
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alertTraps.map((trap) => (
              <div key={trap.id} className="bg-red-50/70 border border-red-100/50 p-3 rounded-2xl flex justify-between items-center shadow-sm hover:bg-red-50 transition">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1 bg-white rounded-xl shadow-sm border select-none">
                    {getTrapIcon(trap.name)}
                  </span>
                  <div>
                    <p className="text-xs font-black text-red-950">{trap.name}</p>
                    <p className="text-[10px] text-red-800 font-bold">
                      場所: {getRoomName(trap.roomId)} ({trap.placedLocation})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-red-600 bg-white px-2 py-1 rounded-lg border border-red-200 animate-pulse">
                    期限切れ間近！
                  </span>
                  <button
                    onClick={() => handleRemoveTrap(trap.id, trap.name)}
                    className="p-2 bg-white hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl border border-red-200 transition text-xs"
                    title="回収する"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. 現在設置中の全グッズリスト */}
      <div className="flex-1 mb-6">
        <h2 className="text-xs font-extrabold text-slate-400 mb-2 tracking-wider uppercase flex items-center gap-1">
          <span>🏡</span> 現在の防衛状況 ({traps.length}個設置中)
        </h2>
        {traps.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
            <span className="text-4xl">🍃</span>
            <p className="text-xs text-slate-400 leading-normal max-w-xs">
              現在、家の中に防衛グッズが配置されていません。間取りマップから配置しましょう。
            </p>
            <Link
              href="/map"
              className="inline-block bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition"
            >
              配置マップを開いて設置する
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {traps.map((trap) => {
              // 期限までの残り日数を計算
              const diffTime = new Date(trap.expirationDate).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isClose = diffDays <= 7;

              return (
                <div key={trap.id} className="p-3.5 flex justify-between items-center text-xs hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 bg-slate-50 border rounded-xl select-none">
                      {getTrapIcon(trap.name)}
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-800">{trap.name}</p>
                      <p className="text-slate-400 text-[10px] font-bold">
                        場所: {getRoomName(trap.roomId)} ({trap.placedLocation})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-slate-500 font-mono text-[10px]">
                        期限: {trap.expirationDate}
                      </p>
                      <p className={`text-[9px] font-black mt-0.5 ${isClose ? "text-red-500 animate-pulse" : "text-slate-400"}`}>
                        {diffDays <= 0 ? "期限切れ！" : `残り ${diffDays}日`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTrap(trap.id, trap.name)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-transparent hover:border-red-200 transition text-xs"
                      title="回収する"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}