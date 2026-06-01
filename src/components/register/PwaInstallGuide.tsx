"use client";

interface PwaInstallGuideProps {
  detectedOS: "ios" | "android" | "desktop";
}

export function PwaInstallGuide({ detectedOS }: PwaInstallGuideProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-slate-800 mb-6">
      <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        ホーム画面へのアプリアイコン追加 (PWA)
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
  );
}
