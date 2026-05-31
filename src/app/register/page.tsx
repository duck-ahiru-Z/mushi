"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { migrateLocalDataToFirebase } from "@/lib/firebase/firestore";

const REGIONS = [
  { id: "hokkaido", name: "北海道エリア" },
  { id: "tohoku", name: "東北エリア" },
  { id: "kanto", name: "関東エリア" },
  { id: "chubu", name: "中部エリア" },
  { id: "kinki", name: "近畿・関西エリア (デフォルト)" },
  { id: "chugoku", name: "中国エリア" },
  { id: "shikoku", name: "四国エリア" },
  { id: "kyushu", name: "九州エリア" },
  { id: "okinawa", name: "沖縄エリア" },
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

  // 表示・通知の追加ステート
  const [bugIllustrationsDisabled, setBugIllustrationsDisabled] = useState(false);
  const [notifyOnDay, setNotifyOnDay] = useState(true);
  const [notify3DaysBefore, setNotify3DaysBefore] = useState(true);
  const [notify7DaysBefore, setNotify7DaysBefore] = useState(true);
  const [notify30DaysBefore, setNotify30DaysBefore] = useState(false);
  const [notifySeasonalAlert, setNotifySeasonalAlert] = useState(true);

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
    setSuccess("地域設定を保存しました。ホームの気候アラートに即時反映されます。");
    setTimeout(() => setSuccess(""), 3000);
  };

  // イラスト表示設定変更保存
  const handleToggleIllustrations = (disabled: boolean) => {
    setBugIllustrationsDisabled(disabled);
    localStorage.setItem("bug_illustrations_disabled", disabled ? "true" : "false");
    localStorage.setItem("illustrations_setting_completed", "true");
    window.dispatchEvent(new Event("safeModeChanged"));
    setSuccess(disabled ? "セーフシールド（イラスト非表示）を有効にしました。" : "標準イラスト表示に戻しました。");
    setTimeout(() => setSuccess(""), 3000);
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
    setSuccess("通知設定を更新しました。");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Firebase Authのエラーコードを分かりやすい日本語メッセージに変換
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "メールアドレスの形式が正しくありません。";
      case "auth/user-disabled":
        return "このアカウントは現在無効化されています。";
      case "auth/user-not-found":
        return "アカウントが見つかりません。メールアドレスを確認するか、新規作成からアカウントを登録してください。";
      case "auth/wrong-password":
        return "パスワードが正しくありません。";
      case "auth/invalid-credential":
        return "ログイン情報（メールアドレスまたはパスワード）が正しくありません。仮アカウントでお試しの場合は、新規登録を行っているか再度ご確認ください。";
      case "auth/email-already-in-use":
        return "このメールアドレスは既に登録されています。サインインするか、別のメールアドレスをお試しください。";
      case "auth/weak-password":
        return "パスワードは6文字以上で入力してください。";
      case "auth/operation-not-allowed":
        return "メール/パスワード認証が有効になっていません。Firebase管理画面を確認してください。";
      case "auth/network-request-failed":
        return "ネットワーク接続に失敗しました。インターネット回線の接続状況をご確認ください。";
      default:
        return `認証エラーが発生しました。 (${errorCode})`;
    }
  };

  // 4. Firebase認証 / ログイン・新規登録処理
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("アカウントを作成しました。");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("ログインに成功しました。");
      }

      const current = auth.currentUser;
      if (current) {
        await migrateLocalDataToFirebase(current.uid);
        setSuccess("同期完了。ローカルの部屋・グッズデータをクラウドと完全に同期しました！");
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      const friendlyMessage = getAuthErrorMessage(err.code || err.message);
      setError(friendlyMessage);
    }
  };

  // 5. ログアウト処理
  const handleLogout = async () => {
    setError("");
    setSuccess("");
    try {
      await signOut(auth);
      setSuccess("ログアウトしました。ゲスト（オフライン）モードに移行しました。");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("ログアウトに失敗しました。");
    }
  };

  // 6. ローカルデータの一括初期化（リセット）
  const handleResetData = () => {
    if (!confirm("警告: すべての間取り（部屋）と防衛グッズのデータが完全に削除されます。よろしいですか？")) {
      return;
    }
    localStorage.removeItem("map_rooms_data");
    localStorage.removeItem("map_floors_data");
    localStorage.removeItem("bug_guard_traps");
    localStorage.removeItem("custom_trap_types");
    
    setSuccess("すべてのアプリデータを初期化しました。");
    window.dispatchEvent(new Event("trapsChanged"));
    setTimeout(() => setSuccess(""), 4000);
  };

  const isUserLoggedIn = !!user;
  const userEmail = user?.email || "";

  return (
    <div className="p-5 flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* ヘッダー */}
      <div className="border-b pb-3 mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          設定とアカウント管理
        </h1>
        <p className="text-xs text-slate-400 mt-1">クラウドデータ同期と通知地域の設定を行えます。</p>
      </div>

      {/* エラー / 成功通知トースト */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-800 text-xs p-3 rounded-xl mb-4 font-semibold">
          エラー: {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl mb-4 font-semibold">
          完了: {success}
        </div>
      )}

      {/* 📱 PWAインストールガイド */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-slate-800 mb-6">
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          📱 ホーム画面へのアプリアイコン追加 (PWA)
        </h2>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          G-Endをスマホのホーム画面にアプリアイコンとして登録（インストール）することで、全画面で使いやすくなり、ブラウザを閉じている際にも期限切れのプッシュ通知を確実に受け取れるようになります。
        </p>

        {detectedOS === "ios" ? (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-600">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              iPhone / iPad (Safari) での追加手順:
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 font-medium text-slate-600">
              <li>標準ブラウザの <strong className="text-teal-600">Safari</strong> で本サイトにアクセスします。</li>
              <li>画面下部のメニューバーにある <strong className="text-teal-600">「共有」ボタン</strong>（四角から矢印が上に出ているアイコン）をタップします。</li>
              <li>表示されたメニューから <strong className="text-teal-600">「ホーム画面に追加」</strong> を選択します。</li>
              <li>右上の <strong className="text-teal-600">「追加」</strong> を押すと、ホーム画面にアプリアイコンが登録されます。</li>
            </ol>
            <p className="text-[10px] text-slate-400 font-bold">※ iOSの仕様上、Safari以外のブラウザ（Chrome等）からはホーム画面に追加できません。</p>
          </div>
        ) : detectedOS === "android" ? (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-600">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              Android (Chrome) での追加手順:
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 font-medium text-slate-600">
              <li>ブラウザ <strong className="text-teal-600">Google Chrome</strong> で本サイトを開きます。</li>
              <li>右上の <strong className="text-teal-600">メニューボタン</strong>（縦の3点リーダー）をタップします。</li>
              <li>リストから <strong className="text-teal-600">「アプリをインストール」</strong> または <strong className="text-teal-600">「ホーム画面に追加」</strong> を選択します。</li>
              <li>確認ダイアログが表示されるので、<strong className="text-teal-600">「インストール」</strong> を選択してください。</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-600">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              PC (Chrome / Edge) での追加手順:
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 font-medium text-slate-600">
              <li>ブラウザのアドレスバーの右端に表示される <strong className="text-teal-600">「インストール」アイコン</strong>（パソコンマーク）をクリックします。</li>
              <li>または、メニューから <strong className="text-teal-600">「G-Endをインストール」</strong> を選択します。</li>
              <li>これでデスクトップ上に登録され、独立したウィンドウでサクサク動作します。</li>
            </ol>
          </div>
        )}
      </div>

      {/* 📍 地域設定セクション */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          警報・予報用の地域設定
        </h2>
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
          指定した地域の気候データに基づき、ホーム画面のアラートや対策図鑑の表示順が自動で最適化されます。
        </p>
        <div className="relative">
          <select
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none text-slate-800"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* 🛡️ イラスト＆通知設定セクション */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          表示と防衛アラート設定
        </h2>
        
        {/* イラスト表示トグル */}
        <div className="flex items-center justify-between py-3 border-b border-slate-50">
          <div>
            <h3 className="text-xs font-bold text-slate-800">セーフシールド機能 (イラスト非表示)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">虫の画像が苦手な方向けに、イラストを優しい盾マークに変更します。</p>
          </div>
          <button
            onClick={() => handleToggleIllustrations(!bugIllustrationsDisabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none ${
              bugIllustrationsDisabled ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md transition-all"></span>
          </button>
        </div>

        {/* 通知タイミング設定 */}
        <div className="pt-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
            期限切れ警告通知タイミング
          </h3>
          <p className="text-[10px] text-slate-400">設置した対策グッズの交換期限が近づいた際に、通知するしきい値を選択できます。</p>
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
              <input
                type="checkbox"
                checked={notifyOnDay}
                onChange={(e) => {
                  setNotifyOnDay(e.target.checked);
                  saveNotificationSettings({ notifyOnDay: e.target.checked });
                }}
                className="accent-teal-600 rounded"
              />
              期限当日
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
              <input
                type="checkbox"
                checked={notify3DaysBefore}
                onChange={(e) => {
                  setNotify3DaysBefore(e.target.checked);
                  saveNotificationSettings({ notify3DaysBefore: e.target.checked });
                }}
                className="accent-teal-600 rounded"
              />
              3日前警告
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
              <input
                type="checkbox"
                checked={notify7DaysBefore}
                onChange={(e) => {
                  setNotify7DaysBefore(e.target.checked);
                  saveNotificationSettings({ notify7DaysBefore: e.target.checked });
                }}
                className="accent-teal-600 rounded"
              />
              7日前警告
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
              <input
                type="checkbox"
                checked={notify30DaysBefore}
                onChange={(e) => {
                  setNotify30DaysBefore(e.target.checked);
                  saveNotificationSettings({ notify30DaysBefore: e.target.checked });
                }}
                className="accent-teal-600 rounded"
              />
              30日前警告
            </label>
          </div>
        </div>

        {/* 季節アラート通知トグル */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-50">
          <div>
            <h3 className="text-xs font-bold text-slate-800">季節の気候脅威アラート</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">登録エリアの気候変化に合わせた害虫活発化の気象警報を受け取ります。</p>
          </div>
          <button
            onClick={() => {
              setNotifySeasonalAlert(!notifySeasonalAlert);
              saveNotificationSettings({ notifySeasonalAlert: !notifySeasonalAlert });
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none ${
              notifySeasonalAlert ? "bg-teal-600 justify-end" : "bg-slate-200 justify-start"
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md transition-all"></span>
          </button>
        </div>
      </div>

      {/* クラウド同期 (Firebase) セクション */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            データベース同期 (Firebase)
          </h2>

          {isUserLoggedIn ? (
            // ログイン済みUI
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center">
              <h3 className="font-bold text-xs text-emerald-950 mt-2">クラウド同期が有効です</h3>
              <p className="text-[10px] text-emerald-800 mt-1 font-mono break-all">
                ログインアカウント: {userEmail}
              </p>
              <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed font-semibold">
                間取りや設置したグッズの期限は安全に同期されています。別のデバイスからログインしても防衛状況を再現できます。
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-sm border border-slate-200"
              >
                サインアウトする
              </button>
            </div>
          ) : (
            // 未ログインUI
            <div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                アカウントを作成してサインインすると、間取り図や設置グッズのデータをFirebase Cloudにバックアップし、他端末やブラウザ再インストール時にも引き継ぐことができます。
              </p>

              <form onSubmit={handleAuth} className="space-y-3">
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="パスワード (6文字以上)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                
                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-md flex justify-center items-center gap-1.5 active:scale-[0.99]"
                >
                  <span>{isSignUp ? "アカウントを新規登録" : "サインインして同期開始"}</span>
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-bold transition"
                >
                  {isSignUp ? "すでにアカウントをお持ちですか？ログインはこちら" : "まだアカウントがありませんか？新規作成はこちら"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ⚠️ 危険ゾーン（データ初期化） */}
        <div className="border-t border-slate-100 pt-5 mt-6">
          <h3 className="text-xs font-bold text-red-600 mb-2">危険エリア</h3>
          <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
            スマホやブラウザをリセットしたい場合、保存されているすべてのデータ（部屋構成・設置したグッズ）を初期化できます。
          </p>
          <button
            onClick={handleResetData}
            className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition"
          >
            アプリ内の全データを初期化する
          </button>
        </div>
      </div>
    </div>
  );
}