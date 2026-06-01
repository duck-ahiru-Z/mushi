"use client";

interface RoomEditorProps {
  houseSize: { width: number; height: number };
  setHouseSize: (size: { width: number; height: number }) => void;
  currentFloorName: string;
  newRoomName: string;
  setNewRoomName: (name: string) => void;
  newRoomType: string;
  setNewRoomType: (type: string) => void;
  onAddRoom: () => void;
}

export function RoomEditor({
  houseSize,
  setHouseSize,
  currentFloorName,
  newRoomName,
  setNewRoomName,
  newRoomType,
  setNewRoomType,
  onAddRoom,
}: RoomEditorProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 space-y-3">
      <div>
        <h2 className="text-xs font-bold text-slate-400 mb-2">全体のキャンバスサイズ（微調整用）</h2>
        <div className="flex items-center gap-4 text-xs bg-slate-50 p-2 rounded-xl w-fit">
          <label>
            横幅:{" "}
            <input
              type="number"
              min="200"
              step="50"
              value={houseSize.width}
              onChange={(e) => setHouseSize({ ...houseSize, width: Math.max(200, Number(e.target.value)) })}
              className="w-16 p-1 border rounded bg-white text-center font-mono"
            />{" "}
            px
          </label>
          <label>
            高さ:{" "}
            <input
              type="number"
              min="200"
              step="50"
              value={houseSize.height}
              onChange={(e) => setHouseSize({ ...houseSize, height: Math.max(200, Number(e.target.value)) })}
              className="w-16 p-1 border rounded bg-white text-center font-mono"
            />{" "}
            px
          </label>
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <h2 className="text-xs font-bold text-slate-400 mb-2">{currentFloorName} に新しい部屋を追加</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="部屋名 (例: トイレ, 脱衣所)"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            className="flex-1 p-2 border rounded-xl text-xs bg-slate-50 font-bold text-slate-800"
          />
          <button
            onClick={onAddRoom}
            className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
