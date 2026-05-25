"use client";
import { useState } from "react";
import { migrateLocalDataToFirebase } from "@/lib/firebase/firestore";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    // ハッカソン版ショートカットロジック：
    // 本来は Firebase Auth を叩きますが、今回は登録成功のモックとして動作させ、
    // 同時にLocalStorageのデータをFirebaseへ移行する関数を呼び出します。
    const mockUid = "mock-user-12345";
    await migrateLocalDataToFirebase(mockUid);
    
    setIsLoggedIn(true);
    alert("アカウントの作成・データの同期が完了しました！これで複数端末から間取りを確認できます。");
  };

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-50">
      <h1 className="text-xl font-bold border-b pb-2 mb-4 text-slate-800">👤 アカウント設定</h1>

      {!isLoggedIn ? (
        <div className="flex flex-col gap-5 flex-1">
          {/* 現在のステータス案内 */}
          <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl shadow-sm text-xs text-teal-950 leading-relaxed">
            <p className="font-bold mb-1">🟢 現在：ゲストモードで利用中</p>
            登録したグッズ情報や間取りピンは、このスマホ（ブラウザ）だけに安全に保存されています。アカウント登録をすると、<strong>家族のスマホと間取りをリアルタイムに共有</strong>できるようになります。
          </div>

          {/* 登録フォーム */}
          <form onSubmit={handleRegister} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-700">家族共有アカウントを作成</h2>
            
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">メールアドレス</label>
              <input 
                type="email" 
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-sm bg-slate-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">パスワード（6文字以上）</label>
              <input 
                type="password" 
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-sm bg-slate-50"
              />
            </div>

            <button 
              type="submit"
              className="mt-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs transition duration-300"
            >
              アカウントを作成してデータを同期する
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center gap-3 flex-1">
          <span className="text-4xl">✨</span>
          <h2 className="text-base font-bold text-slate-800">家族共有モード有効中</h2>
          <p className="text-xs text-slate-400">ログイン中のアカウント: {email}</p>
          <div className="text-xs text-slate-600 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full font-medium border border-emerald-100 mt-2">
            同期ステータス：正常（クラウド保存中）
          </div>
        </div>
      )}
    </div>
  );
}