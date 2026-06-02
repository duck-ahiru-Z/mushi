"use client";

import { ExtendedRoom, Trap } from "@/types/trap";
import { TrapIcon } from "@/components/vector-icons";

interface MapCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  houseSize: { width: number; height: number };
  rooms: ExtendedRoom[];
  traps: Trap[];
  currentFloor: number;
  mode: "place" | "edit";
  onRoomClick: (room: ExtendedRoom, e: React.MouseEvent<HTMLDivElement>) => void;
  onRoomPointerDown: (room: ExtendedRoom, e: React.PointerEvent<HTMLDivElement>) => void;
  onTrapPointerDown: (trap: Trap, roomId: string, e: React.PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerDown: (room: ExtendedRoom, dir: any, e: React.PointerEvent<HTMLDivElement>) => void;
  onTrapClick: (trap: Trap, e: React.MouseEvent) => void;
  onDeleteRoom: (id: string, name: string, e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function MapCanvas({
  containerRef,
  zoom,
  houseSize,
  rooms,
  traps,
  currentFloor,
  mode,
  onRoomClick,
  onRoomPointerDown,
  onTrapPointerDown,
  onHandlePointerDown,
  onTrapClick,
  onDeleteRoom,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: MapCanvasProps) {
  const currentFloorRooms = rooms.filter((r) => r.floor === currentFloor);

  return (
    <div 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="w-full overflow-auto border border-slate-200 bg-slate-50 rounded-md p-4 max-h-[62vh] flex justify-center items-start min-h-[300px]"
    >
      <div
        style={{
          width: `${houseSize.width * zoom}px`,
          height: `${houseSize.height * zoom}px`,
          overflow: "hidden",
          position: "relative",
          transition: "width 0.1s ease, height 0.1s ease",
        }}
        className="flex-shrink-0"
      >
        <div 
          ref={containerRef}
          className="relative bg-white rounded-md border border-slate-300 shadow-sm"
          style={{
            width: `${houseSize.width}px`,
            height: `${houseSize.height}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            touchAction: "none",
          }}
        >
          {/* 各部屋の描画 */}
          {currentFloorRooms.map((room) => (
            <div
              key={room.id}
              onClick={(e) => onRoomClick(room, e)}
              onPointerDown={(e) => onRoomPointerDown(room, e)}
              className={`absolute border rounded-md flex items-center justify-center select-none touch-none ${
                mode === "edit"
                  ? "bg-slate-50 border-slate-400 cursor-move hover:bg-slate-100/80"
                  : "bg-teal-50/20 border-teal-700/30 cursor-crosshair hover:bg-teal-50/40"
              }`}
              style={{
                left: `${room.x}%`,
                top: `${room.y}%`,
                width: `${room.w}%`,
                height: `${room.h}%`,
                touchAction: "none",
              }}
            >
              {/* 部屋名表示（編集モード時は削除ボタンを併記） */}
              <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
                <span className={`text-[10px] font-bold select-none ${mode === "edit" ? "text-slate-700" : "text-teal-900"}`}>
                  {room.name}
                </span>
                {mode === "edit" && (
                  <button
                    onClick={(e) => onDeleteRoom(room.id, room.name, e)}
                    className="pointer-events-auto bg-red-50 hover:bg-red-100 text-red-700 w-10 h-5 flex items-center justify-center rounded text-[9px] font-bold border border-red-200 transition z-30"
                    title="この部屋を削除"
                  >
                    削除
                  </button>
                )}
              </div>
 
              {/* リサイズ掴み手（編集モード用） */}
              {mode === "edit" && (
                <>
                  <div data-resize-dir="n" onPointerDown={(e) => onHandlePointerDown(room, "n", e)} className="absolute top-0 left-3 right-3 h-3 cursor-n-resize -top-1.5 bg-transparent" />
                  <div data-resize-dir="s" onPointerDown={(e) => onHandlePointerDown(room, "s", e)} className="absolute bottom-0 left-3 right-3 h-3 cursor-s-resize -bottom-1.5 bg-transparent" />
                  <div data-resize-dir="e" onPointerDown={(e) => onHandlePointerDown(room, "e", e)} className="absolute top-3 bottom-3 right-0 w-3 cursor-e-resize -right-1.5 bg-transparent" />
                  <div data-resize-dir="w" onPointerDown={(e) => onHandlePointerDown(room, "w", e)} className="absolute top-3 bottom-3 left-0 w-3 cursor-w-resize -left-1.5 bg-transparent" />
                  
                  <div data-resize-dir="nw" onPointerDown={(e) => onHandlePointerDown(room, "nw", e)} className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nw-resize -top-1 -left-1 bg-transparent" />
                  <div data-resize-dir="ne" onPointerDown={(e) => onHandlePointerDown(room, "ne", e)} className="absolute top-0 right-0 w-3.5 h-3.5 cursor-ne-resize -top-1 -right-1 bg-transparent" />
                  <div data-resize-dir="sw" onPointerDown={(e) => onHandlePointerDown(room, "sw", e)} className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-sw-resize -bottom-1 -left-1 bg-transparent" />
                  <div data-resize-dir="se" onPointerDown={(e) => onHandlePointerDown(room, "se", e)} className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize -bottom-1 -right-1 bg-transparent" />
                </>
              )}
 
              {/* 設置グッズのピン（トラップ）の描画 */}
              {traps.filter(t => t.roomId === room.id).map((trap) => (
                <button
                  key={trap.id}
                  onPointerDown={(e) => onTrapPointerDown(trap, room.id, e)}
                  onClick={(e) => onTrapClick(trap, e)}
                  className="absolute trap-marker z-20 pointer-events-auto p-1 bg-white rounded border border-slate-350 hover:border-slate-400 shadow-sm flex items-center justify-center transition active:scale-95 cursor-grab touch-none"
                  style={{
                    left: `calc(${trap.x * 100}% - 14px)`,
                    top: `calc(${trap.y * 100}% - 14px)`,
                    width: "28px",
                    height: "28px",
                    touchAction: "none"
                  }}
                  title={`${trap.name}: ${trap.placedLocation}`}
                >
                  <TrapIcon id={trap.name} size={20} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
