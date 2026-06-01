"use client";
import { TrapIcon } from "@/components/vector-icons";

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
            <label className="text-[10px] font-bold text-slate-400 block mb-1">基本の有効期限（持続月数）</label>
            <div className="relative flex items-center">
              <input
                type="number"
                min="1"
                max="36"
                value={customMonths === 0 ? "" : customMonths}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setCustomMonths("" as any);
                  } else {
                    setCustomMonths(Math.max(1, Math.min(36, Number(val))));
                  }
                }}
                className="w-full p-2.5 pr-8 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <span className="absolute right-3 text-[9px] font-black text-slate-400 pointer-events-none">ヶ月</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">マップ表示アイコン</label>
            <div className="flex gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl justify-start max-h-36 overflow-y-auto shadow-inner border border-slate-100">
              {[
                "🛡️", "🛡️-red", "🛡️-blue", "🛡️-purple", "🛡️-gold", "🛡️-green",
                "🧴", "🧴-blue", "🧴-red", "❄️", "🔥",
                "🌿", "📦", "🪳", "🕷️", "🦟", "🐜", "🪙"
              ].map((emojiOrKey) => (
                <button
                  key={emojiOrKey}
                  type="button"
                  onClick={() => setCustomIcon(emojiOrKey)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition border ${
                    customIcon === emojiOrKey ? "bg-teal-50 border-teal-500 shadow-inner scale-95" : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                  title={emojiOrKey}
                >
                  <TrapIcon id={emojiOrKey} size={22} />
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
