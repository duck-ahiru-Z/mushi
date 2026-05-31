"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTraps } from "@/hooks/usetraps";
import { useFcmToken } from "@/hooks/useFcmToken";
import { detectJapanRegion } from "@/lib/utils";
import { TrapIcon, PestIcon } from "@/components/vector-icons";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

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
  const [userId, setUserId] = useState<string | null>(null);

  // ログイン状態の監視
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          const simEmail = localStorage.getItem("simulated_user_email");
          setUserId(simEmail ? `sim-${simEmail}` : null);
        }
      });
      return () => unsubscribe();
    } catch {
      const simEmail = localStorage.getItem("simulated_user_email");
      setUserId(simEmail ? `sim-${simEmail}` : null);
    }
  }, []);

  const {
    rooms,
    traps,
    deleteTrap,
    getTrapIcon,
    isInitialized,
  } = useTraps(userId);

  const {
    permission,
    isSupported,
    requestNotificationPermission,
    triggerTestNotification,
  } = useFcmToken();

  const [region, setRegion] = useState("kinki");
  const [locationLabel, setLocationLabel] = useState<string>("位置情報：未取得");
  const [currentMonth] = useState<number>(new Date().getMonth() + 1);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // 位置情報のパーミッション監視
  const [geoPermission, setGeoPermission] = useState<"granted" | "prompt" | "denied">("prompt");

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      try {
        navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
          setGeoPermission(result.state as any);
          result.onchange = () => {
            setGeoPermission(result.state as any);
          };
        });
      } catch {}
    }
  }, []);

  // 1. 地域設定の読み込み＆自動位置情報取得
  const loadUserRegionAndDetect = () => {
    const saved = localStorage.getItem("user_region");
    if (saved) {
      setRegion(saved);
      setLocationLabel(REGION_NAMES[saved]);
      return;
    }

    requestGeoPermission();
  };

  const requestGeoPermission = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const detected = detectJapanRegion(lat, lon);
          
          setRegion(detected);
          localStorage.setItem("user_region", detected);
          setLocationLabel(`${REGION_NAMES[detected]} (GPS自動判定)`);
          setGeoPermission("granted");
          window.dispatchEvent(new Event("regionChanged"));
        },
        (error) => {
          console.warn("Geolocation error, using default region:", error);
          setLocationLabel("近畿・関西エリア (デフォルト)");
          setGeoPermission("denied");
        }
      );
    }
  };

  useEffect(() => {
    loadUserRegionAndDetect();

    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("illustrations_setting_completed");
      if (!completed) {
        setShowWelcomeModal(true);
      }
    }
    
    const handleRegionChangeEv = () => {
      const saved = localStorage.getItem("user_region");
      if (saved) {
        setRegion(saved);
        setLocationLabel(REGION_NAMES[saved]);
      }
    };

    window.addEventListener("regionChanged", handleRegionChangeEv);
    return () => window.removeEventListener("regionChanged", handleRegionChangeEv);
  }, []);

  const handleWelcomeSelection = (disableIllustrations: boolean) => {
    localStorage.setItem("bug_illustrations_disabled", disableIllustrations ? "true" : "false");
    localStorage.setItem("illustrations_setting_completed", "true");
    window.dispatchEvent(new Event("safeModeChanged"));
    setShowWelcomeModal(false);
  };

  // 2. 地域と言動シーズンに合わせたリアルタイム害虫活動指数
  const pestAlertInfo = useMemo(() => {
    if (region === "hokkaido") {
      return {
        title: "アカイエカ・コバエ活動期 (北海道)",
        desc: "北海道エリア：気温上昇に伴い、蚊やコバエが発生しやすい環境になります。生ゴミの密閉や水回りのこまめな換気が有効です。",
        bg: "from-sky-50 to-blue-50 border-sky-100 text-sky-900",
        btnText: "対策情報を確認",
      };
    } else if (region === "okinawa") {
      return {
        title: "ゴキブリ・ムカデ活性期 (沖縄)",
        desc: "沖縄エリア：温暖な気候のため通年で害虫発生リスクがあります。キッチン下や浴室配管の隙間など、侵入口の点検と防虫グッズの再配置を行ってください。",
        bg: "from-red-50 to-orange-50 border-red-150 text-red-950",
        btnText: "対策情報を確認",
      };
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      return {
        title: "梅雨・夏季の害虫活動警戒アラート",
        desc: "夏季警戒アラート：高温多湿の環境に入りました。ダニやゴキブリの活動期になりますので、寝具や水回りの対策グッズの設置・交換をお勧めします。",
        bg: "from-amber-50 to-orange-50 border-amber-100 text-amber-950",
        btnText: "推奨対策を確認",
      };
    } else {
      return {
        title: "秋冬の隙間侵入予防アラート",
        desc: "秋冬予防アラート：外気温の低下に伴い、暖かい室内への害虫の侵入が増加します。エアコン配管口やサッシの隙間の点検が有効です。",
        bg: "from-slate-50 to-zinc-50 border-slate-200 text-slate-900",
        btnText: "予防対策を確認",
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
      
      {/* 🛡️ 初回起動時ウェルカム・イラスト非表示選択モーダル */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-5 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col gap-5 text-slate-800 animate-scale-up">
            <div className="text-center space-y-2">
              <h2 className="text-sm font-black text-slate-900">G-End へお越しいただきありがとうございます</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">安心で快適な暮らしの防衛パートナー</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl text-[11px] space-y-3 leading-relaxed text-slate-600">
              <p>
                本アプリでは、家の中の防虫効果をマップ上で視覚的に可視化・管理するため、各種害虫のイラストを使用しています。
              </p>
              <p className="font-bold text-slate-800">
                虫のイラストや画像が苦手ですか？
              </p>
              <p>
                苦手な場合、「セーフシールド（非表示）」をお選びいただくと、アプリ内のすべての虫アイコンが<strong>優しい緑色の盾マーク</strong>に変更されます。この設定は設定画面からいつでも変更できます。
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => handleWelcomeSelection(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black shadow-md transition flex items-center justify-center gap-2"
              >
                優しいシールドで表示する (マイルドモード)
              </button>
              <button
                onClick={() => handleWelcomeSelection(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[11px] font-bold transition flex items-center justify-center gap-2"
              >
                そのまま表示する (標準モード)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex justify-between items-center border-b pb-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-teal-600 tracking-tight flex items-center gap-1">
            G-End
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            管理ダッシュボード • 2026年 {currentMonth}月
          </p>
        </div>
        
        {/* 地域表示ショートカット */}
        <Link
          href="/register"
          className="text-[11px] bg-white border hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-extrabold shadow-sm"
        >
          {locationLabel}
        </Link>
      </div>

      {/* 📡 高級コントロールパネル: 位置情報と通知の許可設定 */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60 mb-5 text-slate-800">
        <h2 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          位置情報と通知の設定
        </h2>
        <p className="text-[10px] text-slate-400 mb-3 leading-normal">
          アプリの天気予報や交換期限のリマインダー通知を正しく受け取るため、許可設定を有効にしてください。
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {/* 位置情報パーミッション */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-bold block">位置情報 (GPS)</span>
              <span className={`text-xs font-black mt-0.5 block ${geoPermission === "granted" ? "text-emerald-600" : "text-amber-600"}`}>
                {geoPermission === "granted" ? "許可済み" : "未許可"}
              </span>
            </div>
            {geoPermission !== "granted" ? (
              <button
                onClick={requestGeoPermission}
                className="mt-3 w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg transition shadow"
              >
                許可する
              </button>
            ) : (
              <span className="text-[8px] text-slate-400 mt-3 font-bold text-right block">自動測位中</span>
            )}
          </div>

          {/* 通知パーミッション */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-bold block">プッシュ通知</span>
              <span className={`text-xs font-black mt-0.5 block ${permission === "granted" ? "text-emerald-600" : "text-amber-600"}`}>
                {permission === "granted" ? "受信可能" : "未許可"}
              </span>
            </div>
            {permission === "default" ? (
              <button
                onClick={requestNotificationPermission}
                className="mt-3 w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg transition shadow"
              >
                通知を許可
              </button>
            ) : permission === "granted" ? (
              <button
                onClick={triggerTestNotification}
                className="mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-lg transition shadow"
              >
                テスト通知を送信する
              </button>
            ) : (
              <span className="text-[8px] text-red-600 mt-3 font-bold text-right block">ブロック中</span>
            )}
          </div>
        </div>
      </div>

      {/* 1. 日本防虫気象協会風 リアルタイム害虫警報 */}
      <div className={`bg-gradient-to-br border p-5 rounded-3xl shadow-md mb-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-lg ${pestAlertInfo.bg}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="font-extrabold text-sm tracking-tight">{pestAlertInfo.title}</h2>
          </div>
          <p className="text-[11px] leading-relaxed font-medium opacity-90 text-slate-700">
            {pestAlertInfo.desc}
          </p>
          <Link
            href="/encyclopedia"
            className="inline-flex items-center mt-3 text-[10px] font-black text-teal-700 bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-teal-200/50 shadow-sm transition"
          >
            {pestAlertInfo.btnText} →
          </Link>
        </div>
        
        {/* 大型ベクターアイコンイラストの挿入（絵文字を完全排除） */}
        <div className="bg-white/40 p-2.5 rounded-2xl border border-white/60 shadow-inner flex-shrink-0">
          <PestIcon 
            id={
              region === "hokkaido" 
                ? "mosquito" 
                : region === "okinawa" 
                ? "cockroach" 
                : currentMonth >= 6 && currentMonth <= 9 
                ? "tick" 
                : "stinkbug"
            } 
            size={56} 
            className="animate-wiggle"
          />
        </div>
      </div>

      {/* 🛠️ オリジナルグッズ作製アピール */}
      <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-200/50 p-5 rounded-3xl shadow-sm mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xs font-extrabold text-teal-800 mb-1 flex items-center gap-1.5">
            自分専用の防衛グッズを作製
          </h2>
          <p className="text-[10px] text-teal-950/80 leading-relaxed font-medium">
            市販の防虫シートや独自の対策グッズをオリジナル名・持続期間で登録し、マイ間取りに美しく設置して一元管理できます。
          </p>
        </div>
        <Link
          href="/map?createCustom=true"
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-[11px] font-black rounded-xl text-center shadow-md transition-all whitespace-nowrap active:scale-[0.98]"
        >
          オリジナルグッズを作製する
        </Link>
      </div>

      {/* 要交換グッズ */}
      <div className="mb-5">
        <h2 className="text-xs font-extrabold text-slate-400 mb-2 tracking-wider uppercase flex items-center gap-1">
          要交換のグッズ ({alertTraps.length})
        </h2>
        {alertTraps.length === 0 ? (
          <div className="bg-white p-6 rounded-3xl text-center border border-slate-200/60 shadow-sm text-xs text-slate-400 leading-relaxed">
            現在、期限が切れている、または7日以内に切れるグッズはありません。<br />家の中は安全に防衛されています。
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alertTraps.map((trap) => (
              <div key={trap.id} className="bg-red-50/50 border border-red-100 p-3.5 rounded-2xl flex justify-between items-center shadow-sm hover:bg-red-50/80 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <span className="p-1 bg-white rounded-xl shadow-inner border border-red-100/50 flex items-center justify-center flex-shrink-0">
                    <TrapIcon id={trap.name} size={32} />
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
                    className="p-1.5 px-3 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl border border-red-200 hover:border-red-300 transition text-[10px] font-bold shadow-sm"
                  >
                    回収
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
          現在の防衛状況 ({traps.length}個設置中)
        </h2>
        {traps.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
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
              const diffTime = new Date(trap.expirationDate).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isClose = diffDays <= 7;

              return (
                <div key={trap.id} className="p-3.5 flex justify-between items-center text-xs hover:bg-slate-50/50 transition-all duration-150">
                  <div className="flex items-center gap-3">
                    <span className="p-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <TrapIcon id={trap.name} size={32} />
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-800 text-[12px]">{trap.name}</p>
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
                      className="p-1.5 px-3 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl border border-slate-100 hover:border-red-200 transition text-[10px] font-bold shadow-sm bg-slate-50/50"
                    >
                      回収
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