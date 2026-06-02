"use client";

import { useState } from "react";
import { CustomTrapType } from "@/hooks/usetraps";
import { TrapIcon } from "@/components/vector-icons";

interface TrapSelectorProps {
  allTrapTypes: CustomTrapType[];
  selectedTrapType: string;
  setSelectedTrapType: (val: string) => void;
  placedLocation: string;
  setPlacedLocation: (val: string) => void;
  placementMonths: number;
  setPlacementMonths: (val: number) => void;
  onRequestCustomModal: () => void;
  onDeleteCustomType?: (name: string, e: React.MouseEvent) => void;
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
  onDeleteCustomType,
}: TrapSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 現在選択されているトラップの情報を取得
  const selectedTrap = allTrapTypes.find((t) => t.name === selectedTrapType) || allTrapTypes[0];

  const handleSelect = (name: string) => {
    setSelectedTrapType(name);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white p-4 rounded-md border border-slate-200 flex flex-col gap-3 text-slate-800 shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-400">配置するグッズを選択</h2>
      </div>

      <button
        onClick={onRequestCustomModal}
        className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
      >
        自分専用のオリジナル防衛グッズを作成する
      </button>

      <div className="flex flex-col gap-2 relative">
        {/* カスタムセレクトトグル */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full p-2.5 border border-slate-200 rounded-md bg-slate-50 text-xs font-bold flex justify-between items-center hover:bg-slate-100 transition active:scale-[0.99] text-left"
        >
          <div className="flex items-center gap-2">
            <span className="p-0.5 bg-white rounded border border-slate-200 flex items-center justify-center">
              <TrapIcon id={selectedTrapType} size={22} />
            </span>
            <span className="font-bold text-slate-850">{selectedTrapType} (基本: {selectedTrap?.months || 3}ヶ月)</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {isDropdownOpen ? "▲" : "▼"}
          </span>
        </button>

        {/* ドロップダウンメニュー */}
        {isDropdownOpen && (
          <div className="absolute top-[46px] left-0 right-0 bg-white border border-slate-300 rounded-md shadow-md z-50 overflow-hidden divide-y divide-slate-200 max-h-60 overflow-y-auto">
            {allTrapTypes.map((type) => {
              const isPreset = ["ゴキブリホイホイ", "ブラックキャップ", "ダニよけシート", "コバエがいなくなるスプレー", "アリの巣コロリ"].includes(type.name);
              return (
                <div
                  key={type.name}
                  className={`w-full flex items-center justify-between transition hover:bg-slate-50/80 ${
                    selectedTrapType === type.name ? "bg-teal-50/40 text-teal-700" : "text-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(type.name)}
                    className="flex-1 p-3 text-xs font-bold flex items-center gap-3 text-left focus:outline-none"
                  >
                    <span className="p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <TrapIcon id={type.name} size={24} />
                    </span>
                    <span className="font-bold break-all">{type.name}</span>
                  </button>
                  <div className="flex items-center gap-2 pr-3.5 flex-shrink-0 select-none">
                    <span className="text-[10px] text-slate-450 font-mono">基本: {type.months}ヶ月</span>
                    {!isPreset && onDeleteCustomType && (
                      <button
                        type="button"
                        onClick={(e) => onDeleteCustomType(type.name, e)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded transition active:scale-90 font-bold text-sm flex items-center justify-center w-5 h-5 focus:outline-none"
                        title="このオリジナルグッズを削除"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="text"
              placeholder="設置場所メモ (例: 冷蔵庫の裏)"
              value={placedLocation}
              onChange={(e) => setPlacedLocation(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-md text-xs bg-slate-50 font-medium text-slate-800 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>
          <div className="relative flex items-center">
            <input
              type="number"
              min="1"
              max="36"
              value={placementMonths === 0 ? "" : placementMonths}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setPlacementMonths("" as any);
                } else {
                  setPlacementMonths(Math.max(1, Math.min(36, Number(val))));
                }
              }}
              className="w-full p-2.5 pr-8 border border-slate-200 rounded-md text-xs bg-slate-50 font-bold text-center focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800"
              title="有効期限を指定した月数で上書きします"
            />
            <span className="absolute right-2.5 text-[9px] font-bold text-slate-400 pointer-events-none">ヶ月</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-teal-700 font-bold bg-slate-50 p-2 rounded-md border border-slate-200 leading-normal">
        <strong>配置方法:</strong> 設置するグッズを選択し、間取り図の配置したい場所をタップしてください。
      </p>
    </div>
  );
}
