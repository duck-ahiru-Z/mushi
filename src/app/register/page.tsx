"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { migrateLocalDataToFirebase } from "@/lib/firebase/firestore";

// 新しく作成したサブコンポーネントをインポート
import { PwaInstallGuide } from "@/components/register/PwaInstallGuide";
import { RegionSettings } from "@/components/register/RegionSettings";
import { NotificationSettings } from "@/components/register/NotificationSettings";
import { AuthSettings } from "@/components/register/AuthSettings";

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
        setSuccess("同期完了。ローカル of 部屋・グッズデータをクラウドと完全に同期しました！");
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
      <PwaInstallGuide detectedOS={detectedOS} />

      {/* 📍 地域設定セクション */}
      <RegionSettings region={region} onRegionChange={handleRegionChange} />

      {/* 🛡️ イラスト＆通知設定セクション */}
      <NotificationSettings
        bugIllustrationsDisabled={bugIllustrationsDisabled}
        onToggleIllustrations={handleToggleIllustrations}
        notifyOnDay={notifyOnDay}
        notify3DaysBefore={notify3DaysBefore}
        notify7DaysBefore={notify7DaysBefore}
        notify30DaysBefore={notify30DaysBefore}
        onNotificationChange={saveNotificationSettings}
        notifySeasonalAlert={notifySeasonalAlert}
        onToggleSeasonalAlert={(enabled) => {
          setNotifySeasonalAlert(enabled);
          saveNotificationSettings({ notifySeasonalAlert: enabled });
        }}
      />

      {/* クラウド同期 (Firebase) セクション */}
      <AuthSettings
        user={user}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        onAuthSubmit={handleAuth}
        onLogout={handleLogout}
        onResetData={handleResetData}
      />
    </div>
  );
}