"use client";
import { useState } from "react";

interface GeoNotificationPanelProps {
  geoPermission: "granted" | "prompt" | "denied";
  requestGeoPermission: () => void;
  permission: NotificationPermission;
  triggerTestNotification: () => void;
  scheduleBackgroundNotification?: (delaySeconds: number, title: string, body: string) => Promise<boolean>;
}

export function GeoNotificationPanel({
  geoPermission,
  requestGeoPermission,
  permission,
  triggerTestNotification,
  scheduleBackgroundNotification,
}: GeoNotificationPanelProps) {
  const [scheduledText, setScheduledText] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSchedule = async (seconds: number, label: string) => {
    if (!scheduleBackgroundNotification) return;
    setIsScheduling(true);
    setScheduledText(null);

    const title = "G-End 防衛アラート";
    const body = `お待たせしました！設定されたテスト通知です。(${label}に設定)`;

    const success = await scheduleBackgroundNotification(seconds, title, body);
    setIsScheduling(false);
    if (success) {
      setScheduledText(`${label}にプッシュ通知を設定しました。アプリを閉じてお待ちください。`);
      // Auto clear after 8 seconds
      setTimeout(() => {
        setScheduledText(null);
      }, 8000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-md border border-slate-200 mb-5 text-slate-800 shadow-sm">
      <h2 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
        位置情報と通知の設定
      </h2>
      <p className="text-[10px] text-slate-400 mb-3 leading-normal">
        害虫の発生予報や対策グッズの交換リマインダー通知を確実に受け取るため、許可設定を有効にしてください。
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {/* 位置情報パーミッション */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-md flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-slate-400 font-bold block">位置情報 (GPS)</span>
            <span className={`text-xs font-bold mt-0.5 block ${geoPermission === "granted" ? "text-emerald-600" : "text-amber-600"}`}>
              {geoPermission === "granted" ? "許可済み" : "未許可"}
            </span>
          </div>
          {geoPermission !== "granted" ? (
            <button
              onClick={requestGeoPermission}
              className="mt-3 w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold rounded-md transition shadow-sm"
            >
              許可する
            </button>
          ) : (
            <span className="text-[8px] text-slate-400 mt-3 font-bold text-right block">自動測位中</span>
          )}
        </div>

        {/* 通知パーミッション */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-md flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-slate-400 font-bold block">プッシュ通知</span>
            <span className={`text-xs font-bold mt-0.5 block ${permission === "granted" ? "text-emerald-600" : "text-amber-600"}`}>
              {permission === "granted" ? "受信可能" : "未設定"}
            </span>
          </div>
          {permission === "denied" ? (
            <span className="text-[8px] text-red-650 mt-3 font-bold text-right block">ブラウザでブロック中</span>
          ) : (
            <button
              onClick={triggerTestNotification}
              className={`mt-3 w-full py-1.5 text-white text-[10px] font-bold rounded-md transition shadow-sm ${
                permission === "granted" ? "bg-slate-800 hover:bg-slate-900" : "bg-teal-700 hover:bg-teal-800"
              }`}
            >
              {permission === "granted" ? "テスト通知を送信" : "通知を設定してテスト"}
            </button>
          )}
        </div>
      </div>

      {/* バックグラウンド（閉じていても届く）検証スケジュールパネル */}
      {permission === "granted" && scheduleBackgroundNotification && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-700 block mb-1">
            ⏳ バックグラウンド通知スケジュール（閉じて検証用）
          </span>
          <p className="text-[9px] text-slate-400 mb-3 leading-normal">
            スケジュール設定後、<strong>ブラウザタブやアプリを完全に閉じて</strong>動作を確認できます。ローカル開発サーバーからプッシュ配信されます。
          </p>

          {scheduledText && (
            <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 rounded-md font-bold leading-relaxed animate-fade-in">
              {scheduledText}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            <button
              disabled={isScheduling}
              onClick={() => handleSchedule(10, "10秒後")}
              className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold rounded-md disabled:opacity-50 transition active:scale-95 text-center shadow-sm"
            >
              10秒後
            </button>
            <button
              disabled={isScheduling}
              onClick={() => handleSchedule(60, "1分後")}
              className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold rounded-md disabled:opacity-50 transition active:scale-95 text-center shadow-sm"
            >
              1分後
            </button>
            <button
              disabled={isScheduling}
              onClick={() => handleSchedule(600, "10分後")}
              className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold rounded-md disabled:opacity-50 transition active:scale-95 text-center shadow-sm"
            >
              10分後
            </button>
            <button
              disabled={isScheduling}
              onClick={() => handleSchedule(86400, "1日後")}
              className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold rounded-md disabled:opacity-50 transition active:scale-95 text-center shadow-sm"
            >
              1日後
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

