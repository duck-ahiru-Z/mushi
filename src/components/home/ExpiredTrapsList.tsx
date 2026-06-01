"use client";

import { Trap } from "@/types/trap";
import { TrapIcon } from "@/components/vector-icons";

interface ExpiredTrapsListProps {
  alertTraps: Trap[];
  getRoomName: (roomId: string) => string;
  onRemoveTrap: (id: string, name: string) => void;
}

export function ExpiredTrapsList({
  alertTraps,
  getRoomName,
  onRemoveTrap,
}: ExpiredTrapsListProps) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-extrabold text-slate-400 mb-2 tracking-wider uppercase flex items-center gap-1">
        要交換のグッズ ({alertTraps.length})
      </h2>
      {alertTraps.length === 0 ? (
        <div className="bg-white p-6 rounded-3xl text-center border border-slate-200/60 shadow-sm text-xs text-slate-400 leading-relaxed">
          現在、期限が切れている、または7日以内に切れるグッズはありません。<br />家の中は安全に防衛されています。
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alertTraps.map((trap) => (
            <div
              key={trap.id}
              className="bg-red-50/50 border border-red-100 p-3.5 rounded-2xl flex justify-between items-center shadow-sm hover:bg-red-50/80 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="p-1 bg-white rounded-xl shadow-inner border border-red-100/50 flex items-center justify-center flex-shrink-0">
                  <TrapIcon id={trap.name} size={32} />
                </span>
                <div>
                  <p className="text-xs font-black text-red-950">{trap.name}</p>
                  <p className="text-[10px] text-red-800 font-bold">
                    場所: {getRoomName(trap.roomId)} ({trap.placedLocation})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-red-600 bg-white px-2 py-1 rounded-lg border border-red-200 animate-pulse">
                  期限切れ間近！
                </span>
                <button
                  onClick={() => onRemoveTrap(trap.id, trap.name)}
                  className="p-1.5 px-3 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl border border-red-200 hover:border-red-300 transition text-[10px] font-bold shadow-sm"
                >
                  回収
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
