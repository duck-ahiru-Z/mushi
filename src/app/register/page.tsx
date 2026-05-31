"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { migrateLocalDataToFirebase } from "@/lib/firebase/firestore";

const REGIONS = [
  { id: "hokkaido", name: "北海道防衛管区 (冷涼)" },
  { id: "tohoku", name: "東北防衛管区" },
  { id: "kanto", name: "関東防衛管区" },
  { id: "chubu", name: "中部防衛管区" },
  { id: "kinki", name: "近畿防衛管区 (デフォルト)" },
  { id: "chugoku", name: "中国防衛管区" },
  { id: "shikoku", name: "四国防衛管区" },
  { id: "kyushu", name: "九州防衛管区" },
  { id: "okinawa", name: "沖縄防衛管区 (最警戒)" },
];

export default function RegisterPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [region, setRegion] = useState("kinki");

  // シミュレーション用ゲストモード状態
  const [isSimulatedUser, setIsSimulatedUser] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState("");

  // 表示・通知の追加ステート
  const [bugIllustrationsDisabled, setBugIllustrationsDisabled] = useState(false);
  const [notifyOnDay, setNotifyOnDay] = useState(true);
  const [notify3DaysBefore, setNotify3DaysBefore] = useState(true);
  const [notify7DaysBefore, setNotify7DaysBefore] = useState(true);
  const [notify30DaysBefore, setNotify30DaysBefore] = useState(false);
  const [notifySeasonalAlert, setNotifySeasonalAlert] = useState(true);

  // 連打リアクション用ステート
  const [shieldToggleCount, setShieldToggleCount] = useState(0);

  // PWA OS判定
  const [detectedOS, setDetectedOS] = useState<"ios" | "android" | "desktop">("desktop");

  // 1. 設定の初期読み込み＆OS検出
  useEffect(() => {
    const savedRegion = localStorage.getItem("user_region");
    if (savedRegion) {
      setRegion(savedRegion);
    }

    const savedDisabled = localStorage.getItem("bug_illustrations_disabled");
    setBugIllustrationsDisabled(savedDisabled === "true");

    const savedNotifySettings = localStorage.getItem("bug_guard_notification_settings");
    if (savedNotifySettings) {
      try {
        const config = JSON.parse(savedNotifySettings);
        if (config.notifyOnDay !== undefined) setNotifyOnDay(config.notifyOnDay);
        if (config.notify3DaysBefore !== undefined) setNotify3DaysBefore(config.notify3DaysBefore);
        if (config.notify7DaysBefore !== undefined) setNotify7DaysBefore(config.notify7DaysBefore);
        if (config.notify30DaysBefore !== undefined) setNotify30DaysBefore(config.notify30DaysBefore);
        if (config.notifySeasonalAlert !== undefined) setNotifySeasonalAlert(config.notifySeasonalAlert);
      } catch {}
    }

    // PWA環境判定
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDetectedOS("ios");
      } else if (/android/.test(ua)) {
        setDetectedOS("android");
      } else {
        setDetectedOS("desktop");
      }
    }
  }, []);

  // 2. Auth監視
  useEffect(() => {
    const simEmail = localStorage.getItem("simulated_user_email");
    if (simEmail) {
      setIsSimulatedUser(true);
      setSimulatedEmail(simEmail);
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  // 3. 地域変更保存
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    localStorage.setItem("user_region", newRegion);
    window.dispatchEvent(new Event("regionChanged"));
    setSuccess("管区設定をセキュアに保存。ホームの警戒予測が即時同期されます。");
    setTimeout(() => setSuccess(""), 4000);
  };

  // イラスト表示設定変更保存（連打イースターエッグ付き）
  const handleToggleIllustrations = (disabled: boolean) => {
    setBugIllustrationsDisabled(disabled);
    localStorage.setItem("bug_illustrations_disabled", disabled ? "true" : "false");
    localStorage.setItem("illustrations_setting_completed", "true");
    window.dispatchEvent(new Event("safeModeChanged"));

    // 連打カウントからくり
    const newCount = shieldToggleCount + 1;
    setShieldToggleCount(newCount);

    if (newCount >= 6) {
      setSuccess("🚨 警告: 精神シールド過負荷状態！「そんなに虫が怖いのですか？我々G-End防衛AIが、物理的かつ精神的にお守りします。心拍数を落ち着けてください」");
      setShieldToggleCount(0);
    } else if (newCount >= 4) {
      setSuccess("🛡️ システム警告: 精神障壁シールドの急速な展開と解除が繰り返されています。AIが自動で警戒状態を維持しています。");
    } else {
      setSuccess(disabled ? "セーフシールド（精神保護・イラスト非表示）を有効化しました。" : "標準戦闘グラフィック（イラスト表示）に戻しました。");
    }

    setTimeout(() => setSuccess(""), 4000);
  };

  // 通知タイミング変更保存
  const saveNotificationSettings = (updates: {
    notifyOnDay?: boolean;
    notify3DaysBefore?: boolean;
    notify7DaysBefore?: boolean;
    notify30DaysBefore?: boolean;
    notifySeasonalAlert?: boolean;
  }) => {
    const newConfig = {
      notifyOnDay: updates.notifyOnDay !== undefined ? updates.notifyOnDay : notifyOnDay,
      notify3DaysBefore: updates.notify3DaysBefore !== undefined ? updates.notify3DaysBefore : notify3DaysBefore,
      notify7DaysBefore: updates.notify7DaysBefore !== undefined ? updates.notify7DaysBefore : notify7DaysBefore,
      notify30DaysBefore: updates.notify30DaysBefore !== undefined ? updates.notify30DaysBefore : notify30DaysBefore,
      notifySeasonalAlert: updates.notifySeasonalAlert !== undefined ? updates.notifySeasonalAlert : notifySeasonalAlert,
    };
    
    localStorage.setItem("bug_guard_notification_settings", JSON.stringify(newConfig));
    setSuccess("防衛通知しきい値を更新しました。");
    setTimeout(() => setSuccess(""), 3000);
  };

  // 4. Firebase認証 / シミュレーションログイン処理
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("認証ID（メールアドレス）およびアクセスコード（パスワード）を入力してください。");
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("新規クラウド防衛アカウントを作成しました。");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("クラウド防衛システムにサインインしました。");
      }

      const current = auth.currentUser;
      if (current) {
        await migrateLocalDataToFirebase(current.uid);
        setSuccess("同期完了。ローカルの全間取り・防衛データをクラウドデータベースに完全統合。");
      }
    } catch (err: any) {
      console.warn("Firebase Auth fallback to simulation:", err.message);
      // ローカルシミュレーションログインを実行（デモ用）
      localStorage.setItem("simulated_user_email", email);
      setIsSimulatedUser(true);
      setSimulatedEmail(email);
      setSuccess("防衛同期セッションを開始。間取りと期限データはローカル＆模擬同期で保護されています。");
    }
  };

  // 5. ログアウト処理
  const handleLogout = async () => {
    setError("");
    setSuccess("");
    try {
      await signOut(auth);
    } catch {}
    
    localStorage.removeItem("simulated_user_email");
    setIsSimulatedUser(false);
    setSimulatedEmail("");
    setSuccess("クラウド防衛システムから切断。ゲスト（オフライン）モードに移行しました。");
    setTimeout(() => setSuccess(""), 4000);
  };

  // 6. ローカルデータの一括初期化（リセット）
  const handleResetData = () => {
    if (!confirm("🚨 警告: すべての間取り（部屋）と防衛グッズのデータが、物理ストレージから完全に消去されます。この操作は取り消せません。よろしいですか？")) {
      return;
    }
    localStorage.removeItem("map_rooms_data");
    localStorage.removeItem("map_floors_data");
    localStorage.removeItem("bug_guard_traps");
    localStorage.removeItem("custom_trap_types");
    
    setSuccess("全防衛データの物理初期化を完了しました。再構築を開始してください。");
    window.dispatchEvent(new Event("trapsChanged"));
    setTimeout(() => setSuccess(""), 4000);
  };

  const isUserLoggedIn = !!user || isSimulatedUser;
  const userEmail = user?.email || simulatedEmail;

  return (
    <div className="p-5 flex flex-col min-h-screen bg-slate-950 text-zinc-100">
      {/* ヘッダー */}
      <div className="border-b border-zinc-800 pb-3 mb-6">
        <h1 className="text-xl font-black text-cyan-400 flex items-center gap-2 tracking-wide uppercase">
          SYSTEM CONTROL / システム設定
        </h1>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">
          G-End Defensive Core - Configurations & Cloud Integration
        </p>
      </div>

      {/* エラー / 成功通知トースト風 (サイバー調) */}
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-xs p-3 rounded-xl mb-4 font-semibold font-mono flex items-center gap-2">
          <span>[SYSTEM ERROR]</span> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs p-3 rounded-xl mb-4 font-semibold font-mono flex items-center gap-2">
          <span>[CORE RESPONSE]</span> {success}
        </div>
      )}

      {/* 📱 PWAインストールガイド */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-5 rounded-2xl shadow-sm text-zinc-100 mb-6">
        <h2 className="text-xs font-black text-cyan-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          🛰️ PWA: ホーム画面へのアプリアイコン追加
        </h2>
        <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
          G-Endをスマホのホーム画面にインストール（アプリ登録）することで、全画面で起動でき、ブラウザを閉じている際にも期限切れのバックグラウンド通知警告が極めて確実に動作するようになります。
        </p>

        {detectedOS === "ios" ? (
          <div className="space-y-3 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 text-[11px] leading-relaxed">
            <div className="text-xs font-black text-amber-500 flex items-center gap-1">
              iOS (Safari) 防衛端末への追加手順:
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300 font-medium">
              <li>ブラウザ <strong className="text-cyan-400 font-bold">Safari</strong> で本サイトにアクセスします。</li>
              <li>画面下部メニューにある <strong className="text-cyan-400 font-bold">「共有」ボタン</strong>（四角に上矢印のアイコン）をタップします。</li>
              <li>表示されたオプションから <strong className="text-cyan-400 font-bold">「ホーム画面に追加」</strong> を選択します。</li>
              <li>右上の <strong className="text-cyan-400 font-bold">「追加」</strong> をタップすると、ホーム画面に漆黒のG-Endアイコンが出現します。</li>
            </ol>
            <p className="text-[9px] text-zinc-500 font-bold">※ iOSの制約上、Safari以外のブラウザ（Chrome等）からはホーム画面に追加できません。</p>
          </div>
        ) : detectedOS === "android" ? (
          <div className="space-y-3 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 text-[11px] leading-relaxed">
            <div className="text-xs font-black text-emerald-500 flex items-center gap-1">
              Android (Chrome) 防衛端末への追加手順:
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300 font-medium">
              <li>ブラウザ <strong className="text-cyan-400 font-bold">Google Chrome</strong> で本サイトを開きます。</li>
              <li>メニュー（右上または右下の縦の <strong className="text-cyan-400 font-bold">3点リーダー</strong>）をタップします。</li>
              <li>リスト内の <strong className="text-cyan-400 font-bold">「アプリをインストール」</strong> または <strong className="text-cyan-400 font-bold">「ホーム画面に追加」</strong> を選択します。</li>
              <li>インストール確認画面で <strong className="text-cyan-400 font-bold">「インストール」</strong> を押すと、アプリ一覧とホーム画面に登録されます。</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 text-[11px] leading-relaxed">
            <div className="text-xs font-black text-cyan-400 flex items-center gap-1">
              PC (Chrome / Edge) 防衛コンソールへの追加手順:
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300 font-medium">
              <li>ブラウザのアドレスバー右端に表示される <strong className="text-cyan-400 font-bold">「インストール（パソコンマーク）」</strong> をクリックします。</li>
              <li>または、ブラウザメニューから <strong className="text-cyan-400 font-bold">「G-Endをインストール」</strong> を選択します。</li>
              <li>これでデスクトップ上の独立した漆黒ウィンドウとして、WebブラウザのUIなしで軽快に動作します。</li>
            </ol>
          </div>
        )}
      </div>

      {/* 📍 地域設定セクション */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-5 rounded-2xl shadow-sm mb-6">
        <h2 className="text-xs font-black text-cyan-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          📡 DEFENSE ZONE / 防衛管区設定
        </h2>
        <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
          現在地が属する防衛管区の気候アルゴリズムに基づき、シーズンごとの侵入警戒警報の頻度や、対策図鑑の警戒レベル順位が動的に最適化されます。
        </p>
        <div className="relative">
          <select
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 appearance-none"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500 text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* 🛡️ イラスト＆通知設定セクション */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-5 rounded-2xl shadow-sm mb-6">
        <h2 className="text-xs font-black text-cyan-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          ⚙️ DISPLAY & ALERTS / 表示・通知プロトコル
        </h2>
        
        {/* イラスト表示トグル */}
        <div className="flex items-center justify-between py-3 border-b border-zinc-800/60">
          <div>
            <h3 className="text-xs font-bold text-zinc-200">精神保護セーフシールド (イラスト非表示)</h3>
            <p className="text-[9px] text-zinc-500 mt-0.5 font-medium">虫のグラフィックが生理的に苦手な方向け。全画面の虫アイコンが「優しい緑の盾」に変換されます。</p>
          </div>
          <button
            onClick={() => handleToggleIllustrations(!bugIllustrationsDisabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none ${
              bugIllustrationsDisabled ? "bg-emerald-600 justify-end" : "bg-zinc-800 justify-start"
            }`}
          >
            <span className="bg-zinc-100 w-4 h-4 rounded-full shadow-md transition-all"></span>
          </button>
        </div>

        {/* 通知タイミング設定 */}
        <div className="pt-4 space-y-3">
          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1">
            防衛グッズ交換期限の警告トリガー
          </h3>
          <p className="text-[9px] text-zinc-500">設置した薬剤やグッズの交換期限が迫った際、バックグラウンド警告を発火するしきい値です（複数選択可）。</p>
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={notifyOnDay}
                onChange={(e) => {
                  setNotifyOnDay(e.target.checked);
                  saveNotificationSettings({ notifyOnDay: e.target.checked });
                }}
                className="accent-cyan-500 rounded bg-zinc-950 border-zinc-800"
              />
              期限当日
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={notify3DaysBefore}
                onChange={(e) => {
                  setNotify3DaysBefore(e.target.checked);
                  saveNotificationSettings({ notify3DaysBefore: e.target.checked });
                }}
                className="accent-cyan-500 rounded bg-zinc-950 border-zinc-800"
              />
              3日前警告
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={notify7DaysBefore}
                onChange={(e) => {
                  setNotify7DaysBefore(e.target.checked);
                  saveNotificationSettings({ notify7DaysBefore: e.target.checked });
                }}
                className="accent-cyan-500 rounded bg-zinc-950 border-zinc-800"
              />
              7日前警告
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={notify30DaysBefore}
                onChange={(e) => {
                  setNotify30DaysBefore(e.target.checked);
                  saveNotificationSettings({ notify30DaysBefore: e.target.checked });
                }}
                className="accent-cyan-500 rounded bg-zinc-950 border-zinc-800"
              />
              30日前警告
            </label>
          </div>
        </div>

        {/* 季節アラート通知トグル */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-800/60">
          <div>
            <h3 className="text-xs font-bold text-zinc-200">活性期シーズナル警告アラート</h3>
            <p className="text-[9px] text-zinc-500 mt-0.5 font-medium">防衛管区での気温・湿度急変に伴う、特定害虫の活発化警報をリアルタイム受信します。</p>
          </div>
          <button
            onClick={() => {
              setNotifySeasonalAlert(!notifySeasonalAlert);
              saveNotificationSettings({ notifySeasonalAlert: !notifySeasonalAlert });
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none ${
              notifySeasonalAlert ? "bg-cyan-500 justify-end" : "bg-zinc-800 justify-start"
            }`}
          >
            <span className="bg-zinc-950 w-4 h-4 rounded-full shadow-md transition-all"></span>
          </button>
        </div>
      </div>

      {/* クラウド同期 (Firebase) セクション */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-5 rounded-2xl shadow-sm mb-6 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-xs font-black text-cyan-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            ☁️ CLOUD SYNCHRONIZATION / クラウド同期
          </h2>

          {isUserLoggedIn ? (
            // ログイン済みUI
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping mr-1.5"></div>
              <h3 className="font-black text-xs text-emerald-400 inline-block">クラウド保護シールド：有効</h3>
              <p className="text-[10px] text-zinc-400 mt-2 font-mono break-all">
                SECURE ACCESS ID: {userEmail}
              </p>
              <p className="text-[9px] text-zinc-500 mt-2.5 leading-relaxed font-semibold">
                作成したすべてのマイ間取り部屋レイアウト、配置防衛グッズのリアルタイム交換期限が、クラウド暗号化ストレージに安全に保管され、マルチデバイスで完全に同期されています。
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-bold transition shadow-sm border border-zinc-700"
              >
                接続を解除する (サインアウト)
              </button>
            </div>
          ) : (
            // 未ログインUI
            <div>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                防衛アカウントを作成しクラウドとセッションを確立すると、間取り図や設置グッズの状況がFirebase Cloudに即時バックアップされ、スマホ紛失やブラウザ再インストール時にも完璧に防衛状況を復元できます。
              </p>

              <form onSubmit={handleAuth} className="space-y-3">
                <input
                  type="email"
                  placeholder="アクセスID（メールアドレス）"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl text-xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="アクセスコード（パスワード: 6文字以上）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl text-xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                />
                
                <button
                  type="submit"
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-zinc-950 text-xs font-black rounded-xl transition shadow-md flex justify-center items-center gap-1.5 active:scale-[0.99]"
                >
                  <span>{isSignUp ? "新規防衛ライセンスの登録" : "セキュア接続を開始 (サインイン)"}</span>
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition"
                >
                  {isSignUp ? "既存の防衛IDをお持ちですか？サインインはこちら" : "防衛IDを新規に作製しますか？登録はこちら"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ⚠️ 危険ゾーン（データ初期化） */}
        <div className="border-t border-zinc-800/80 pt-5 mt-6">
          <h3 className="text-xs font-bold text-red-500 mb-2 uppercase tracking-widest font-mono">⚠️ CRITICAL ZONE / 危険領域</h3>
          <p className="text-[9px] text-zinc-500 mb-3 leading-relaxed">
            防衛デバイスを完全に売却、または初期状態から再構築したい場合、端末とローカルキャッシュに格納された全データを物理削除します。
          </p>
          <button
            onClick={handleResetData}
            className="w-full py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/60 hover:border-red-800 text-red-400 text-xs font-bold rounded-xl transition font-mono"
          >
            PURGE LOCAL DATA / アプリ内全データの抹消
          </button>
        </div>
      </div>
    </div>
  );
}