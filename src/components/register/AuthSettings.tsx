"use client";

import { User } from "firebase/auth";

interface AuthSettingsProps {
  user: User | null;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  onAuthSubmit: (e: React.FormEvent) => void;
  onLogout: () => void;
  onResetData: () => void;
}

export function AuthSettings({
  user,
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  onAuthSubmit,
  onLogout,
  onResetData,
}: AuthSettingsProps) {
  const isUserLoggedIn = !!user;
  const userEmail = user?.email || "";

  return (
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
              onClick={onLogout}
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

            <form onSubmit={onAuthSubmit} className="space-y-3">
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

      {/* 危険ゾーン（データ初期化） */}
      <div className="border-t border-slate-100 pt-5 mt-6">
        <h3 className="text-xs font-bold text-red-600 mb-2">危険エリア</h3>
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
          ブラウザでのデータをリセットしたい場合、保存されているすべてのデータ（部屋構成・設置したグッズ）を初期化できます。
        </p>
        <button
          onClick={onResetData}
          className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition"
        >
          アプリ内の全データを初期化する
        </button>
      </div>
    </div>
  );
}
