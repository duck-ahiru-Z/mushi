"use client";
import { useState, useEffect, useRef } from "react";
import { Room, Trap } from "@/types/trap";
import { saveTrapData, fetchTraps } from "@/lib/firebase/firestore";

export default function MapPage() {
  // モード管理: 'place'(配置) または 'edit'(間取り編集)
  const [mode, setMode] = useState<"place" | "edit">("place");
  
  // キャンバスのサイズを取得するためのRef
  const containerRef = useRef<HTMLDivElement>(null);

  // 画面の初期読み込みが完了したかどうかのフラグ（Next.jsのエラー防止用）
  const [isLoaded, setIsLoaded] = useState(false);

  // ドラッグ中の状態管理
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    roomX: number;
    roomY: number;
    w: number;
    h: number;
  } | null>(null);

  // 部屋のデータ（初期値は空にしておき、useEffectで読み込みます）
  const [rooms, setRooms] = useState<Room[]>([]);

  // 新規部屋作成用のフォーム状態
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("living");

  // トラップ配置用の状態
  const [traps, setTraps] = useState<Trap[]>([]);
  const [trapName, setTrapName] = useState<string>("ゴキブリホイホイ");
  const [placedLocation, setPlacedLocation] = useState<string>("");

  // ⏳ ページを開いたときにデータを復元する処理
  useEffect(() => {
    // 1. 部屋データをブラウザの保存領域から読み込む
    const savedRooms = localStorage.getItem("map_rooms_data");
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    } else {
      // 過去の保存データがない場合のデフォルト配置
      setRooms([
        { id: "room-1", name: "キッチン", type: "kitchen", x: 10, y: 10, w: 40, h: 40 },
        { id: "room-2", name: "リビング", type: "living", x: 50, y: 10, w: 40, h: 60 },
      ]);
    }
    setIsLoaded(true); // 部屋データの読み込み完了

    // 2. トラップデータをFirebaseから読み込む（既存処理）
    const loadData = async () => {
      const data = await fetchTraps(null);
      setTraps(data);
    };
    loadData();
  }, []);

  // 💾 部屋のデータ（位置や追加・削除）が変わるたびに自動で保存する処理
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("map_rooms_data", JSON.stringify(rooms));
    }
  }, [rooms, isLoaded]);

  // 部屋を追加する関数
  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    const room: Room = {
      id: `room-${Date.now()}`,
      name: newRoomName,
      type: newRoomType,
      x: 30,
      y: 30,
      w: 30,
      h: 30,
    };
    setRooms([...rooms, room]);
    setNewRoomName("");
  };

  // 部屋を削除する関数
  const handleDeleteRoom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRooms(rooms.filter((r) => r.id !== id));
    setTraps(traps.filter((t) => t.roomId !== id));
  };

  // 部屋の位置・サイズを更新する関数
  const handleUpdateRoom = (id: string, field: keyof Room, value: number | string) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // --- ドラッグ&ドロップのハンドラー ---
  const handlePointerDown = (room: Room, e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "edit") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({
      id: room.id,
      startX: e.clientX,
      startY: e.clientY,
      roomX: room.x,
      roomY: room.y,
      w: room.w,
      h: room.h,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    if (dragging.id !== e.currentTarget.dataset.roomId) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const deltaX = e.clientX - dragging.startX;
    const deltaY = e.clientY - dragging.startY;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    let newX = Math.round(dragging.roomX + deltaXPercent);
    let newY = Math.round(dragging.roomY + deltaYPercent);

    newX = Math.max(0, Math.min(100 - dragging.w, newX));
    newY = Math.max(0, Math.min(100 - dragging.h, newY));

    setRooms((prev) =>
      prev.map((r) => (r.id === dragging.id ? { ...r, x: newX, y: newY } : r))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
  };
  // ------------------------------------

  // 部屋クリック時の処理（配置モード時のみ動作）
  const handleRoomClick = async (room: Room, e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "place") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    let months = 3;
    if (trapName === "ブラックキャップ") months = 6;
    if (trapName === "ダニよけシート") months = 2;

    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + months);

    const newTrap: Trap = {
      id: `trap-${Date.now()}`,
      userId: null,
      name: trapName,
      placedLocation: placedLocation || `${room.name}の隅`,
      roomId: room.id,
      x: clickX,
      y: clickY,
      placedDate: new Date().toISOString().split("T")[0],
      expirationDate: expDate.toISOString().split("T")[0],
      isActive: true,
    };

    setTraps([...traps, newTrap]);
    await saveTrapData(newTrap, null);
    setPlacedLocation("");
    alert(`${room.name}に「${trapName}」を配置しました！`);
  };

  // 読み込みが完了するまではエラー防止のため真っ白な画面のバグを防ぐ
  if (!isLoaded) {
    return <div className="p-4 text-slate-500 text-sm">間取りを読み込み中...</div>;
  }

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <h1 className="text-xl font-bold border-b pb-2 mb-4">🏡 マイ間取り・グッズ配置</h1>

      {/* モード切り替えタブ */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("place")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
            mode === "place" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          📍 グッズを配置する
        </button>
        <button
          onClick={() => setMode("edit")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
            mode === "edit" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          🛠️ 間取りを編集する
        </button>
      </div>

      {/* モードに応じたコントロールパネル */}
      {mode === "place" ? (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-100 animate-fadeIn">
          <h2 className="text-sm font-bold text-slate-500 mb-3">🛠️ 配置するグッズを選択</h2>
          <div className="flex flex-col gap-3">
            <select
              value={trapName}
              onChange={(e) => setTrapName(e.target.value)}
              className="w-full p-2 border rounded-lg bg-slate-50 text-sm"
            >
              <option value="ゴキブリホイホイ">ゴキブリホイホイ (期限3ヶ月)</option>
              <option value="ブラックキャップ">ブラックキャップ (期限6ヶ月)</option>
              <option value="ダニよけシート">ダニよけシート (期限2ヶ月)</option>
            </select>
            <input
              type="text"
              placeholder="詳しい場所メモ (例: 冷蔵庫の裏)"
              value={placedLocation}
              onChange={(e) => setPlacedLocation(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm bg-slate-50"
            />
            <p className="text-xs text-slate-400">※下の間取りの、置きたい場所を直接タップして配置します。</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-100 animate-fadeIn">
          <h2 className="text-sm font-bold text-slate-500 mb-3">➕ 新しい部屋を追加</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="部屋名 (例: 寝室)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="flex-1 p-2 border rounded-lg text-sm bg-slate-50"
            />
            <button onClick={handleAddRoom} className="px-4 bg-indigo-600 text-white rounded-lg text-sm font-bold">
              追加
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-500 mb-2">📐 部屋の位置とサイズ調整</h2>
          <div className="max-h-40 overflow-y-auto space-y-3 pr-1">
            {rooms.map((room) => (
              <div key={room.id} className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs">
                <span className="font-bold w-16 truncate">{room.name}</span>
                <label>X:<input type="number" value={room.x} onChange={(e) => handleUpdateRoom(room.id, "x", Number(e.target.value))} className="w-10 p-1 border rounded ml-1" /></label>
                <label>Y:<input type="number" value={room.y} onChange={(e) => handleUpdateRoom(room.id, "y", Number(e.target.value))} className="w-10 p-1 border rounded ml-1" /></label>
                <label>幅:<input type="number" value={room.w} onChange={(e) => handleUpdateRoom(room.id, "w", Number(e.target.value))} className="w-10 p-1 border rounded ml-1" /></label>
                <label>高:<input type="number" value={room.h} onChange={(e) => handleUpdateRoom(room.id, "h", Number(e.target.value))} className="w-10 p-1 border rounded ml-1" /></label>
                <button onClick={(e) => handleDeleteRoom(room.id, e)} className="text-red-500 font-bold ml-auto">削除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* キャンバス画面 */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-square bg-slate-200 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden shadow-inner"
      >
        {rooms.map((room) => (
          <div
            key={room.id}
            data-room-id={room.id}
            onClick={(e) => handleRoomClick(room, e)}
            onPointerDown={(e) => handlePointerDown(room, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`absolute border-2 rounded-lg shadow-sm transition-colors flex items-center justify-center ${
              mode === "edit"
                ? "bg-indigo-50 border-indigo-500/40 cursor-move select-none touch-none"
                : "bg-teal-50 border-teal-600/40 hover:bg-teal-100/70 cursor-crosshair"
            }`}
            style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%` }}
          >
            <span className={`text-xs font-bold select-none ${mode === "edit" ? "text-indigo-800" : "text-teal-800"}`}>
              {room.name}
            </span>

            {/* トラップの描画 */}
            {traps
              .filter((t) => t.roomId === room.id && t.isActive)
              .map((trap) => (
                <div
                  key={trap.id}
                  className="absolute w-5 h-5 bg-red-500 border border-white rounded-full flex items-center justify-center text-[10px] text-white shadow handle-bounce"
                  style={{ left: `${trap.x * 100}%`, top: `${trap.y * 100}%`, transform: "translate(-50%, -50%)" }}
                  title={`${trap.name} (${trap.placedLocation})`}
                  onClick={(e) => e.stopPropagation()}
                >
                  📍
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}