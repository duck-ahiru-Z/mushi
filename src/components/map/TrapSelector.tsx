"use client";

import { CustomTrapType } from "@/hooks/usetraps";

interface TrapSelectorProps {
  allTrapTypes: CustomTrapType[];
  selectedTrapType: string;
  setSelectedTrapType: (val: string) => void;
  placedLocation: string;
  setPlacedLocation: (val: string) => void;
  placementMonths: number;
  setPlacementMonths: (val: number) => void;
  onRequestCustomModal: () => void;
}

export function TrapSelector({
  allTrapTypes,
  selectedTrapType,
  setSelectedTrapType,
  placedLocation,
  setPlacedLocation,
  placementMonths,
  setPlacementMonths,
  onRequestCustomModal,
}: TrapSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-extrabold text-slate-400">🛠️ 配置するグッズを選択</h2>
      </div>

      <button
        onClick={onRequestCustomModal}
        className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
      >
        自分専用のオリジナル防衛グッズを作製する
      </button>

      <div className="flex flex-col gap-2">
        <select
          value={selectedTrapType}
          onChange={(e) => setSelectedTrapType(e.target.value)}
          className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold focus:outline-none"
        >
          {allTrapTypes.map((type) => (
            <option key={type.name} value={type.name}>
              {type.icon} {type.name} (基本: {type.months}ヶ月)
            </option>
          ))}
        </select>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="text"
              placeholder="設置場所メモ (例: 冷蔵庫の裏)"
              value={placedLocation}
              onChange={(e) => setPlacedLocation(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-medium"
            />
          </div>
          <div className="relative flex items-center">
            <input
              type="number"
              min="1"
              max="36"
              value={placementMonths}
              onChange={(e) => setPlacementMonths(Math.max(1, Number(e.target.value)))}
              className="w-full p-2.5 pr-8 border rounded-xl text-xs bg-slate-50 font-black text-center focus:outline-none"
              title="有効期限を指定した月数で上書きします"
            />
            <span className="absolute right-2.5 text-[9px] font-black text-slate-400 pointer-events-none">ヶ月</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-teal-600 font-bold bg-teal-50/50 p-2 rounded-lg leading-normal">
        <strong>配置方法:</strong> 設置するグッズを選択し、間取り図の配置したい場所をタップしてください。
      </p>
    </div>
  );
}
