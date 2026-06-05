"use client";

interface NotificationSettingsProps {
  bugIllustrationsDisabled: boolean;
  onToggleIllustrations: (disabled: boolean) => void;
  notifyOnDay: boolean;
  notify3DaysBefore: boolean;
  notify7DaysBefore: boolean;
  notify30DaysBefore: boolean;
  onNotificationChange: (updates: {
    notifyOnDay?: boolean;
    notify3DaysBefore?: boolean;
    notify7DaysBefore?: boolean;
    notify30DaysBefore?: boolean;
  }) => void;
  notifySeasonalAlert: boolean;
  onToggleSeasonalAlert: (enabled: boolean) => void;
}

export function NotificationSettings({
  bugIllustrationsDisabled,
  onToggleIllustrations,
  notifyOnDay,
  notify3DaysBefore,
  notify7DaysBefore,
  notify30DaysBefore,
  onNotificationChange,
  notifySeasonalAlert,
  onToggleSeasonalAlert,
}: NotificationSettingsProps) {
  return (
    <div className="bg-white p-5 rounded-md border border-slate-200 mb-6">
      <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        表示と通知アラート設定
      </h2>
      
      {/* イラスト表示トグル */}
      <div className="flex items-center justify-between py-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800">セーフシールド機能 (イラスト非表示)</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">虫の画像が苦手な方向けに、イラストを優しい盾マークに変更します。</p>
        </div>
        <button
          onClick={() => onToggleIllustrations(!bugIllustrationsDisabled)}
          className={`w-12 h-6 flex items-center rounded-md p-1 transition-all duration-300 focus:outline-none ${
            bugIllustrationsDisabled ? "bg-emerald-600 justify-end" : "bg-slate-200 justify-start"
          }`}
        >
          <span className="bg-white w-4 h-4 rounded-sm border border-slate-300 transition-all"></span>
        </button>
      </div>

      {/* 通知タイミング設定 */}
      <div className="pt-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
          期限切れ警告通知タイミング
        </h3>
        <p className="text-[10px] text-slate-400">設置した対策グッズの交換期限が近づいた際に、通知するタイミングを設定できます。</p>
        
        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
            <input
              type="checkbox"
              checked={notifyOnDay}
              onChange={(e) => onNotificationChange({ notifyOnDay: e.target.checked })}
              className="accent-teal-700 rounded-sm"
            />
            期限当日
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
            <input
              type="checkbox"
              checked={notify3DaysBefore}
              onChange={(e) => onNotificationChange({ notify3DaysBefore: e.target.checked })}
              className="accent-teal-700 rounded-sm"
            />
            3日前警告
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
            <input
              type="checkbox"
              checked={notify7DaysBefore}
              onChange={(e) => onNotificationChange({ notify7DaysBefore: e.target.checked })}
              className="accent-teal-700 rounded-sm"
            />
            7日前警告
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 cursor-pointer transition select-none text-[11px] font-bold text-slate-700">
            <input
              type="checkbox"
              checked={notify30DaysBefore}
              onChange={(e) => onNotificationChange({ notify30DaysBefore: e.target.checked })}
              className="accent-teal-700 rounded-sm"
            />
            30日前警告
          </label>
        </div>
      </div>

      {/* 季節アラート通知トグル */}
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800">季節の気候脅威アラート</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">登録エリアの気候変化に合わせた害虫活発化の気象警報を受け取ります。</p>
        </div>
        <button
          onClick={() => onToggleSeasonalAlert(!notifySeasonalAlert)}
          className={`w-12 h-6 flex items-center rounded-md p-1 transition-all duration-300 focus:outline-none ${
            notifySeasonalAlert ? "bg-teal-700 justify-end" : "bg-slate-200 justify-start"
          }`}
        >
          <span className="bg-white w-4 h-4 rounded-sm border border-slate-300 transition-all"></span>
        </button>
      </div>
    </div>
  );
}
