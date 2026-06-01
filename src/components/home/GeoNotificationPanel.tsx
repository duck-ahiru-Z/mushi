"use client";

interface GeoNotificationPanelProps {
  geoPermission: "granted" | "prompt" | "denied";
  requestGeoPermission: () => void;
  permission: NotificationPermission;
  triggerTestNotification: () => void;
}

export function GeoNotificationPanel({
  geoPermission,
  requestGeoPermission,
  permission,
  triggerTestNotification,
}: GeoNotificationPanelProps) {
  return (
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
              {permission === "granted" ? "受信可能" : "未設定"}
            </span>
          </div>
          {permission === "denied" ? (
            <span className="text-[8px] text-red-600 mt-3 font-bold text-right block">ブラウザでブロック中</span>
          ) : (
            <button
              onClick={triggerTestNotification}
              className={`mt-3 w-full py-1.5 text-white text-[10px] font-bold rounded-lg transition shadow ${
                permission === "granted" ? "bg-slate-800 hover:bg-slate-900" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {permission === "granted" ? "テスト通知を送信" : "通知を設定してテスト"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
