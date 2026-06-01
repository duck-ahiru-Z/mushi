"use client";

import Link from "next/link";
import { Trap } from "@/types/trap";
import { TrapIcon } from "@/components/vector-icons";

interface ActiveTrapsListProps {
  traps: Trap[];
  getRoomName: (roomId: string) => string;
  onRemoveTrap: (id: string, name: string) => void;
}

export function ActiveTrapsList({
  traps,
  getRoomName,
  onRemoveTrap,
}: ActiveTrapsListProps) {
  return (
    <div className="flex-1 mb-6">
      <h2 className="text-xs font-extrabold text-slate-400 mb-2 tracking-wider uppercase flex items-center gap-1">
        現在の防衛状況 ({traps.length}個設置中)
      </h2>
      {traps.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
          <p className="text-xs text-slate-400 leading-normal max-w-xs">
            現在、家の中に防衛グッズが配置されていません。間取りマップから配置しましょう。
          </p>
          <Link
            href="/map"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition"
          >
            配置マップを開いて設置する
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
          {traps.map((trap) => {
            const diffTime = new Date(trap.expirationDate).getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isClose = diffDays <= 7;

            return (
              <div
                key={trap.id}
                className="p-3.5 flex justify-between items-center text-xs hover:bg-slate-50/50 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <TrapIcon id={trap.name} size={32} />
                  </span>
                  <div>
                    <p className="font-extrabold text-slate-800 text-[12px]">{trap.name}</p>
                    <p className="text-slate-400 text-[10px] font-bold">
                      場所: {getRoomName(trap.roomId)} ({trap.placedLocation})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-slate-500 font-mono text-[10px]">
                      期限: {trap.expirationDate}
                    </p>
                    <p className={`text-[9px] font-black mt-0.5 ${isClose ? "text-red-500 animate-pulse" : "text-slate-400"}`}>
                      {diffDays <= 0 ? "期限切れ！" : `残り ${diffDays}日`}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveTrap(trap.id, trap.name)}
                    className="p-1.5 px-3 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl border border-slate-100 hover:border-red-200 transition text-[10px] font-bold shadow-sm bg-slate-50/50"
                  >
                    回収
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
