"use client";

interface FloorSelectorProps {
  floors: number[];
  currentFloor: number;
  setCurrentFloor: (floor: number) => void;
  mode: "place" | "edit";
  onAddUpperFloor: () => void;
  onAddLowerFloor: () => void;
  onDeleteCurrentFloor: () => void;
  getFloorName: (floor: number) => string;
  zoom: number;
  setZoom: (zoom: number) => void;
}

export function FloorSelector({
  floors,
  currentFloor,
  setCurrentFloor,
  mode,
  onAddUpperFloor,
  onAddLowerFloor,
  onDeleteCurrentFloor,
  getFloorName,
  zoom,
  setZoom,
}: FloorSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 bg-slate-100 p-2 rounded-md flex-wrap border border-slate-200">
      {/* 左: 階数操作 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onAddLowerFloor}
          className="px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          地下階を追加
        </button>
        
        <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200 overflow-x-auto max-w-[150px] sm:max-w-none">
          {floors.sort((a, b) => a - b).map((floor) => (
            <button
              key={floor}
              onClick={() => setCurrentFloor(floor)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                currentFloor === floor ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {getFloorName(floor)}
            </button>
          ))}
        </div>
        
        <button
          onClick={onAddUpperFloor}
          className="px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          地上階を追加
        </button>
        
        {mode === "edit" && floors.length > 1 && (
          <button
            onClick={onDeleteCurrentFloor}
            className="px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
          >
            この階を削除
          </button>
        )}
      </div>

      {/* 右: ズーム調整ボタン */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-md border border-slate-200 shadow-sm ml-auto">
        <span className="text-[10px] font-bold text-slate-400 px-1">ズーム:</span>
        <button
          onClick={() => setZoom(Math.max(0.4, Number((zoom - 0.1).toFixed(2))))}
          className="w-6 h-6 flex items-center justify-center bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-bold"
        >
          -
        </button>
        <span className="text-[10px] font-bold text-slate-700 min-w-[36px] text-center font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(1.6, Number((zoom + 0.1).toFixed(2))))}
          className="w-6 h-6 flex items-center justify-center bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoom(typeof window !== "undefined" && window.innerWidth < 640 ? 0.55 : 1)}
          className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 px-1.5 py-1 rounded-md border border-slate-200 text-slate-500"
        >
          リセット
        </button>
      </div>
    </div>
  );
}
