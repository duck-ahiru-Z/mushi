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
  hokkaido: "北海道防衛管区",
  tohoku: "東北防衛管区",
  kanto: "関東防衛管区",
  chubu: "中部防衛管区",
  kinki: "近畿防衛管区",
  chugoku: "中国防衛管区",
  shikoku: "四国防衛管区",
  kyushu: "九州防衛管区",
  okinawa: "沖縄防衛管区",
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
          setLocationLabel(`${REGION_NAMES[detected]} (GPS判定)`);
          setGeoPermission("granted");
          window.dispatchEvent(new Event("regionChanged"));
        },
        (error) => {
          console.warn("Geolocation error, using default region:", error);
          setLocationLabel("近畿防衛管区 (デフォルト)");
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

  // 2. 地域に合わせたリアルタイム害虫活動指数 (サイバーミリタリー仕様)
  const pestAlertInfo = useMemo(() => {
    if (region === "hokkaido") {
      return {
        title: "アカイエカ・コバエ活動期 (冷涼地域)",
        desc: "防衛管区情報：気温上昇により局所的なモスキートおよびコバエの活動を確認。排水溝および生ゴミ貯蔵エリアの封鎖（密閉）を推奨します。",
        bg: "from-sky-950/40 to-cyan-950/40 border-cyan-900/60 text-cyan-200",
        btnText: "管区対策データを開く",
      };
    } else if (region === "okinawa") {
      return {
        title: "ゴキブリ・ムカデ超活性期 (熱帯警戒地域)",
        desc: "最警戒管区情報：高温多湿の持続により、大型害虫の活動値が最大レベルを記録中。侵入口（配管隙間・サッシ）の防護シールド強化を最優先で実施してください。",
        bg: "from-red-950/40 to-orange-950/40 border-red-900/60 text-red-200",
        btnText: "即時防衛プロトコルを起動",
      };
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      return {
        title: "夏期害虫活発化 最大警戒アラート",
        desc: "熱帯夜警報：ダニ・ゴキブリの繁殖係数がピークに達しています。設置済みの毒餌剤・防虫シートの有効期限を再点検し、防衛ラインを死守してください。",
        bg: "from-amber-950/40 to-red-950/40 border-amber-900/60 text-amber-200",
        btnText: "緊急交換推奨データ",
      };
    } else {
      return {
        title: "秋冬季・温暖隙間侵入予防警戒",
        desc: "防湿予防警報：外気温の低下に伴い、害虫が暖房の効いた室内へと侵入するリスクが急増。エアコン配管口、サッシ周りの最終障壁を構築してください。",
        bg: "from-zinc-900/60 to-zinc-950/60 border-zinc-800 text-zinc-300",
        btnText: "予防侵入阻止データ",
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
    if (confirm(`「${name}」の耐用限界が到達したため回収しますか？設置マップから自動で抹消されます。`)) {
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
        return room ? room.name : "不明なエリア";
      } catch {}
    }
    return "未特定の防衛区画";
  };

  // 6. 全部屋にグッズが設置完了しているかの判定 (完璧な防壁からくり)
  const isPerfectDefense = useMemo(() => {
    if (rooms.length === 0) return false;
    const roomIds = rooms.map((r) => r.id);
    const placedRoomIds = new Set(traps.map((t) => t.roomId));
    return roomIds.every((id) => placedRoomIds.has(id));
  }, [rooms, traps]);

  if (!isInitialized) {
    return (
      <div className="p-5 flex flex-col min-h-screen bg-slate-950 text-cyan-400 font-mono text-xs items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border border-cyan-500 border-t-transparent"></div>
        <span>LAUNCHING DEFENSE SYSTEM / 防衛システム起動中...</span>
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col min-h-screen bg-slate-950 text-zinc-100">
      
      {/* 🛡️ 初回起動時ウェルカム・イラスト非表示選択モーダル (サイバー調) */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-5 backdrop-blur-md">
          <div className="bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-zinc-800 flex flex-col gap-5 text-zinc-200">
            <div className="text-center space-y-2 border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider">WELCOME TO G-END</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">対虫最終防衛システム・ライセンス認証</p>
            </div>
            
            <div className="bg-zinc-950 p-4 rounded-2xl text-[11px] space-y-3 leading-relaxed text-zinc-400 font-mono border border-zinc-900">
              <p>
                本システムでは、家屋内の対虫戦闘力をマップ上で視覚的にマッピング・管理するため、各種害虫のグラフィックデータを使用します。
              </p>
              <p className="font-bold text-amber-500">
                ■ 虫のグラフィック表示を規制（非表示化）しますか？
              </p>
              <p>
                規制（セーフシールド）を有効にすると、すべての虫グラフィックが<strong>「緑色の強固な防衛シールド」</strong>アイコンに置換されます。この設定は設定コアルームからいつでも変更可能です。
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => handleWelcomeSelection(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-zinc-950 rounded-2xl text-[11px] font-black shadow-md transition flex items-center justify-center gap-2"
              >
                セーフシールド有効 (精神保護・マイルドモード)
              </button>
              <button
                onClick={() => handleWelcomeSelection(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-[11px] font-bold transition flex items-center justify-center gap-2 border border-zinc-700"
              >
                標準戦闘モード (グラフィックの全表示)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-cyan-400 tracking-tight flex items-center gap-1.5 uppercase font-mono">
            G-End
          </h1>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
            Defensive Command Dashboard • 2026 / M0{currentMonth}
          </p>
        </div>
        
        {/* 地域表示管区 */}
        <Link
          href="/register"
          className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-bold font-mono"
        >
          {locationLabel}
        </Link>
      </div>

      {/* 📡 高級コントロールパネル: 最終防衛システムステータス */}
      <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-4 rounded-3xl mb-5 shadow-sm">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
          🛰️ SYSTEM PERMISSIONS STATUS / 最終防衛システムステータス
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {/* 位置情報パーミッション */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold font-mono">LOCATION GPS</span>
              <span className={`text-xs font-bold font-mono ${geoPermission === "granted" ? "text-emerald-400" : "text-amber-500"}`}>
                {geoPermission === "granted" ? "ONLINE / 測位中" : "OFFLINE / 未許可"}
              </span>
            </div>
            {geoPermission !== "granted" ? (
              <button
                onClick={requestGeoPermission}
                className="mt-2.5 w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-400 text-[10px] font-black rounded-lg transition"
              >
                測位許可をアクティベート
              </button>
            ) : (
              <span className="text-[8px] text-zinc-500 mt-2 font-bold font-mono text-right block">SECURE CONNECTION</span>
            )}
          </div>

          {/* 通知パーミッション */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold font-mono">PUSH WARNINGS</span>
              <span className={`text-xs font-bold font-mono ${permission === "granted" ? "text-emerald-400" : "text-amber-500"}`}>
                {permission === "granted" ? "ONLINE / 受信可能" : "OFFLINE / 未許可"}
              </span>
            </div>
            {permission === "default" ? (
              <button
                onClick={requestNotificationPermission}
                className="mt-2.5 w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-400 text-[10px] font-black rounded-lg transition"
              >
                プッシュ通信を有効化
              </button>
            ) : permission === "granted" ? (
              <button
                onClick={triggerTestNotification}
                className="mt-2.5 w-full py-1.5 bg-zinc-850 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg transition border border-zinc-750"
              >
                テスト警告弾発射
              </button>
            ) : (
              <span className="text-[8px] text-red-500 mt-2 font-bold font-semibold">ブラウザ設定でブロック中</span>
            )}
          </div>
        </div>
      </div>

      {/* 🛡️ 完璧な防壁イースターエッグからくりメッセージ */}
      {isPerfectDefense && (
        <div className="bg-gradient-to-br from-emerald-950/50 to-zinc-950/50 border border-emerald-800/80 p-5 rounded-3xl shadow-lg mb-5 animate-pulse-subtle">
          <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
            <span className="text-xs font-black tracking-widest font-mono">[BARRIER ACTIVE / 完璧なる絶対防衛障壁]</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-300/90 font-mono">
            <strong>全区画の絶対防衛を完了：</strong>家屋内の全指定区画への抗重力・対害虫薬剤展開が100%確立されました。現在、害虫が物理的および次元空間的に侵入できる確率は <strong>0.00001% 未満</strong> です。人類の強固な防衛戦勝利がここに確定しました。警戒稼働を維持してください。
          </p>
        </div>
      )}

      {/* 1. 管区害虫脅威警報 */}
      <div className={`bg-gradient-to-br border p-5 rounded-3xl shadow-md mb-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-lg ${pestAlertInfo.bg}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="font-extrabold text-sm tracking-tight text-zinc-100">{pestAlertInfo.title}</h2>
          </div>
          <p className="text-[11px] leading-relaxed font-medium opacity-90 text-zinc-300 font-mono">
            {pestAlertInfo.desc}
          </p>
          <Link
            href="/encyclopedia"
            className="inline-flex items-center mt-3 text-[10px] font-black text-cyan-400 bg-zinc-950/80 hover:bg-zinc-900 px-3 py-1.5 rounded-xl border border-cyan-800/50 shadow-sm transition"
          >
            {pestAlertInfo.btnText} →
          </Link>
        </div>
        
        {/* 大型ベクターアイコンイラストの挿入（絵文字を完全排除） */}
        <div className="bg-zinc-950/80 p-2.5 rounded-2xl border border-zinc-800 shadow-inner flex-shrink-0">
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
      <div className="bg-gradient-to-r from-cyan-950/40 to-emerald-950/40 border border-cyan-900/40 p-5 rounded-3xl shadow-sm mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xs font-black text-cyan-400 mb-1 tracking-wider uppercase">
            🛡️ DEFENSE ARSENAL / オリジナル防衛装備の調合
          </h2>
          <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
            市販の特注シートやご自宅固有の防虫トラップを、カスタム名称および任意の有効稼働限界（月数）で登録し、防衛線（間取り）上に戦略配置可能です。
          </p>
        </div>
        <Link
          href="/map?createCustom=true"
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-zinc-950 text-[11px] font-black rounded-xl text-center shadow-md transition-all whitespace-nowrap active:scale-[0.98]"
        >
          オリジナル防衛装備を調合する
        </Link>
      </div>

      {/* 要交換グッズ */}
      <div className="mb-5">
        <h2 className="text-[10px] font-black text-red-500 mb-2 tracking-widest uppercase font-mono">
          🚨 CRITICAL LIMITS / 耐用限界限界区画 ({alertTraps.length})
        </h2>
        {alertTraps.length === 0 ? (
          <div className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-3xl text-center border border-zinc-800/80 shadow-sm text-xs text-zinc-500 leading-relaxed font-mono">
            現在、耐用限界を迎えた、または7日以内に限界に達する装備はありません。<br />家屋内の全障壁は極めて健全に維持されています。
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alertTraps.map((trap) => (
              <div key={trap.id} className="bg-red-950/20 border border-red-900/60 p-3.5 rounded-2xl flex justify-between items-center shadow-sm hover:bg-red-950/40 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <span className="p-1 bg-zinc-950 rounded-xl shadow-inner border border-red-900/40 flex items-center justify-center flex-shrink-0">
                    <TrapIcon id={trap.name} size={32} />
                  </span>
                  <div>
                    <p className="text-xs font-black text-red-400">{trap.name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">
                      区画: {getRoomName(trap.roomId)} ({trap.placedLocation})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-red-400 bg-red-950 border border-red-800 px-2 py-1 rounded-lg animate-pulse font-mono">
                    耐用限界！
                  </span>
                  <button
                    onClick={() => handleRemoveTrap(trap.id, trap.name)}
                    className="p-1.5 px-3 bg-zinc-900 hover:bg-red-950 text-red-400 rounded-xl border border-red-900/40 hover:border-red-800 transition text-[10px] font-bold shadow-sm"
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
        <h2 className="text-[10px] font-black text-zinc-500 mb-2 tracking-widest uppercase font-mono">
          🛡️ STRATEGIC PLACEMENTS / 防衛布陣 ({traps.length}個配備中)
        </h2>
        {traps.length === 0 ? (
          <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-2xl text-center border border-zinc-800/80 shadow-sm flex flex-col items-center gap-3">
            <p className="text-xs text-zinc-500 leading-normal max-w-xs font-mono">
              現在、防御ライン上に防衛装備が配備されていません。戦略配置マップから配備を実行してください。
            </p>
            <Link
              href="/map"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-zinc-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition active:scale-[0.98]"
            >
              戦略配置マップを開く
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-zinc-800/80 divide-y divide-zinc-800/60 overflow-hidden">
            {traps.map((trap) => {
              const diffTime = new Date(trap.expirationDate).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isClose = diffDays <= 7;

              return (
                <div key={trap.id} className="p-3.5 flex justify-between items-center text-xs hover:bg-zinc-850/30 transition-all duration-150">
                  <div className="flex items-center gap-3">
                    <span className="p-1 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <TrapIcon id={trap.name} size={32} />
                    </span>
                    <div>
                      <p className="font-bold text-zinc-100 text-[12px]">{trap.name}</p>
                      <p className="text-zinc-500 text-[10px] font-medium font-mono">
                        区画: {getRoomName(trap.roomId)} ({trap.placedLocation})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-zinc-400 font-mono text-[10px]">
                        限界日: {trap.expirationDate}
                      </p>
                      <p className={`text-[9px] font-black mt-0.5 font-mono ${isClose ? "text-red-400 animate-pulse" : "text-zinc-500"}`}>
                        {diffDays <= 0 ? "限界超過！" : `残り稼働: ${diffDays}日`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTrap(trap.id, trap.name)}
                      className="p-1.5 px-3 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 rounded-xl border border-zinc-800 hover:border-red-900/50 transition text-[10px] font-bold shadow-sm bg-zinc-950/60"
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