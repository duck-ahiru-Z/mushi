"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTraps } from "@/hooks/usetraps";
import { useFcmToken } from "@/hooks/useFcmToken";
import { detectArea } from "@/lib/utils";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

// 新しく作成したサブコンポーネントをインポート
import { GeoNotificationPanel } from "@/components/home/GeoNotificationPanel";
import { PestAlertCard } from "@/components/home/PestAlertCard";
import { ExpiredTrapsList } from "@/components/home/ExpiredTrapsList";
import { ActiveTrapsList } from "@/components/home/ActiveTrapsList";

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
        setUserId(user ? user.uid : null);
      });
      return () => unsubscribe();
    } catch {
      setUserId(null);
    }
  }, []);

  const {
    rooms,
    traps,
    deleteTrap,
    isInitialized,
  } = useTraps(userId);

  const {
    permission,
    requestNotificationPermission,
    triggerTestNotification,
    scheduleBackgroundNotification,
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
          const closestArea = detectArea(lat, lon);
          
          setRegion(closestArea.id);
          localStorage.setItem("user_region", closestArea.id);
          setLocationLabel(`${REGION_NAMES[closestArea.id]} (GPS自動判定)`);
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

  return (
    <div className="p-5 flex flex-col min-h-screen bg-slate-50 text-slate-800">
      
      {/* 初回起動時ウェルカム・イラスト非表示選択モーダル */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-md rounded-md shadow-lg p-6 border border-slate-200 flex flex-col gap-5 text-slate-800">
            <div className="text-center space-y-2">
              <h2 className="text-sm font-bold text-slate-900">G-End へお越しいただきありがとうございます</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">安心で快適な暮らしの防衛パートナー</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-250 text-[11px] space-y-3 leading-relaxed text-slate-600">
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
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition flex items-center justify-center gap-2"
              >
                優しいシールドで表示する (マイルドモード)
              </button>
              <button
                onClick={() => handleWelcomeSelection(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-2"
              >
                そのまま表示する (標準モード)
              </button>
            </div>
          </div>
        </div>
      )}

     
      {/* 高級コントロールパネル: 位置情報と通知の許可設定 */}
      <GeoNotificationPanel
        geoPermission={geoPermission}
        requestGeoPermission={requestGeoPermission}
        permission={permission}
        triggerTestNotification={triggerTestNotification}
        scheduleBackgroundNotification={scheduleBackgroundNotification}
      />

      {/* 1. 日本防虫気象協会風 リアルタイム害虫警報 */}
      <PestAlertCard region={region} currentMonth={currentMonth} />

      {/* オリジナルグッズ作製アピール */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-md mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xs font-bold text-slate-800 mb-1">
            自分専用の防衛グッズを作製
          </h2>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            市販の防虫シートや独自の対策グッズをオリジナル名・持続期間で登録し、マイ間取りに美しく設置して一元管理できます。
          </p>
        </div>
        <Link
          href="/map?createCustom=true"
          className="w-full sm:w-auto px-4 py-2 bg-teal-650 hover:bg-teal-750 text-white text-[11px] font-bold rounded-md text-center transition-all whitespace-nowrap active:scale-[0.98]"
        >
          オリジナルグッズを作製する
        </Link>
      </div>

      {/* 要交換グッズ */}
      <ExpiredTrapsList
        alertTraps={alertTraps}
        getRoomName={getRoomName}
        onRemoveTrap={handleRemoveTrap}
      />

      {/* 現在設置中の全グッズリスト */}
      <ActiveTrapsList
        traps={traps}
        getRoomName={getRoomName}
        onRemoveTrap={handleRemoveTrap}
      />
    </div>
  );
}