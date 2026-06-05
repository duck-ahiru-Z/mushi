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
    <div className="bg-white p-5 rounded-md border border-slate-200 mb-6 flex-1 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          データベース同期
        </h2>

        {isUserLoggedIn ? (
          // ログイン済みUI
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md text-center">
            <h3 className="font-bold text-xs text-emerald-950 mt-2">クラウド同期が有効です</h3>
            <p className="text-[10px] text-emerald-800 mt-1 font-mono break-all">
              ログインアカウント: {userEmail}
            </p>
            <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed font-semibold">
              間取りや設置したグッズの期限は安全に同期されています。別のデバイスからログインしても管理状況を再現できます。
            </p>
            <button
              onClick={onLogout}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-bold transition border border-slate-200"
            >
              サインアウトする
            </button>
          </div>
        ) : (
          // 未ログインUI
          <div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              アカウントを作成してサインインすると、間取り図や設置グッズのデータをクラウドにバックアップし、他端末やブラウザ再インストール時にも引き継ぐことができます。
            </p>

            <form onSubmit={onAuthSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-md text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
              <input
                type="password"
                placeholder="パスワード (6文字以上)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-md text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
              
              <button
                type="submit"
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-md transition flex justify-center items-center gap-1.5 active:scale-[0.99]"
              >
                <span>{isSignUp ? "アカウントを新規登録" : "サインインして同期開始"}</span>
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-teal-700 hover:text-teal-800 font-bold transition"
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
          スマホやブラウザをリセットしたい場合、保存されているすべてのデータ（部屋構成・設置したグッズ）を初期化できます。
        </p>
        <button
          onClick={onResetData}
          className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-md transition"
        >
          アプリ内の全データを初期化する
        </button>
      </div>
    </div>
  );
}
