"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PestIcon } from "@/components/vector-icons";

interface PestAlertCardProps {
  region: string;
  currentMonth: number;
}

export function PestAlertCard({ region, currentMonth }: PestAlertCardProps) {
  const alertInfo = useMemo(() => {
    if (region === "hokkaido") {
      return {
        title: "アカイエカ・コバエ活動期 (北海道)",
        desc: "北海道エリア：気温上昇に伴い、蚊やコバエが発生しやすい環境になります。生ゴミの密閉や水回りのこまめな換気が有効です。",
        bg: "from-sky-50 to-blue-50 border-sky-100 text-sky-900",
        btnText: "対策情報を確認",
        iconId: "mosquito",
      };
    } else if (region === "okinawa") {
      return {
        title: "ゴキブリ・ムカデ活性期 (沖縄)",
        desc: "沖縄エリア：温暖な気候のため通年で害虫発生リスクがあります。キッチン下や浴室配管の隙間など、侵入口 of 点検と防虫グッズの再配置を行ってください。",
        bg: "from-red-50 to-orange-50 border-red-150 text-red-950",
        btnText: "対策情報を確認",
        iconId: "cockroach",
      };
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      return {
        title: "梅雨・夏季の害虫活動警戒アラート",
        desc: "夏季警戒アラート：高温多湿の環境に入りました。ダニやゴキブリの活動期になりますので、寝具や水回りの対策グッズの設置・交換をお勧めします。",
        bg: "from-amber-50 to-orange-50 border-amber-100 text-amber-950",
        btnText: "推奨対策を確認",
        iconId: "tick",
      };
    } else {
      return {
        title: "秋冬の隙間侵入予防アラート",
        desc: "秋冬予防アラート：外気温の低下に伴い、暖かい室内への害虫の侵入が増加します。エアコン配管口やサッシの隙間の点検が有効です。",
        bg: "from-slate-50 to-zinc-50 border-slate-200 text-slate-900",
        btnText: "予防対策を確認",
        iconId: "stinkbug",
      };
    }
  }, [region, currentMonth]);

  return (
    <div className={`bg-gradient-to-br border p-5 rounded-3xl shadow-md mb-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-lg ${alertInfo.bg}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="font-extrabold text-sm tracking-tight">{alertInfo.title}</h2>
        </div>
        <p className="text-[11px] leading-relaxed font-medium opacity-90 text-slate-700">
          {alertInfo.desc}
        </p>
        <Link
          href="/encyclopedia"
          className="inline-flex items-center mt-3 text-[10px] font-black text-teal-700 bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-teal-200/50 shadow-sm transition"
        >
          {alertInfo.btnText} →
        </Link>
      </div>
      
      <div className="bg-white/40 p-2.5 rounded-2xl border border-white/60 shadow-inner flex-shrink-0">
        <PestIcon 
          id={alertInfo.iconId} 
          size={56} 
          className="animate-wiggle"
        />
      </div>
    </div>
  );
}
