"use client";

interface CustomTrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  customName: string;
  setCustomName: (val: string) => void;
  customMonths: number;
  setCustomMonths: (val: number) => void;
  customIcon: string;
  setCustomIcon: (val: string) => void;
  onCreateCustom: () => void;
}

export function CustomTrapModal({
  isOpen,
  onClose,
  customName,
  setCustomName,
  customMonths,
  setCustomMonths,
  customIcon,
  setCustomIcon,
  onCreateCustom,
}: CustomTrapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 animate-scale-up text-slate-800">
        <div>
          <h3 className="font-black text-sm text-slate-900">オリジナルグッズの登録</h3>
          <p className="text-[10px] text-slate-400">オリジナルの防虫グッズやスプレーを登録し、間取りに配置して期限管理できます。</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">グッズの名前</label>
            <input
              type="text"
              placeholder="例: バルサン置くだけダニシート"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">有効期限（持続月数）</label>
            <select
              value={customMonths}
              onChange={(e) => setCustomMonths(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            >
              <option value="1">1ヶ月 (例: コバエ用)</option>
              <option value="2">2ヶ月</option>
              <option value="3">3ヶ月 (例: 一般ホイホイ)</option>
              <option value="6">6ヶ月 (例: 毒餌剤)</option>
              <option value="12">12ヶ月 (1年持続)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">マップ表示アイコン</label>
            <div className="flex gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl justify-between">
              {["🪳", "🕷️", "🦟", "🐜", "🌿", "🧴", "📦", "🪙", "🛡️"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setCustomIcon(emoji)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition border ${
                    customIcon === emoji ? "bg-slate-800 border-slate-800 text-white shadow" : "bg-white hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onCreateCustom}
            className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-[0.98]"
          >
            登録して選択する
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
