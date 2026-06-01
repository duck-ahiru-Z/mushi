import { LAYOUT_TEMPLATES } from "@/hooks/usetraps";

interface RoomEditorProps {
  houseSize: { width: number; height: number };
  setHouseSize: (size: { width: number; height: number }) => void;
  currentFloorName: string;
  newRoomName: string;
  setNewRoomName: (name: string) => void;
  newRoomType: string;
  setNewRoomType: (type: string) => void;
  onAddRoom: () => void;
  onApplyTemplate: (templateId: string) => void;
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
  onApplyTemplate,
}: RoomEditorProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 space-y-3 text-slate-800">
      <div>
        <h2 className="text-xs font-bold text-slate-400 mb-2">間取りテンプレートを適用</h2>
        <p className="text-[10px] text-slate-400 mb-2.5 leading-relaxed">
          よくある家構成の間取り図をワンタップで作成できます。（既存の配置部屋・グッズはリセットされます）
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onApplyTemplate(tpl.id)}
              className="p-2.5 text-[10px] font-black bg-slate-50 border border-slate-200/80 hover:bg-teal-50 hover:border-teal-500 hover:text-teal-700 text-slate-700 rounded-xl transition text-center active:scale-[0.98] leading-tight flex flex-col justify-center items-center gap-1 shadow-sm"
              title={tpl.description}
            >
              <span>{tpl.name}</span>
            </button>
          ))}
        </div>
      </div>
      <hr className="border-slate-100" />
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
