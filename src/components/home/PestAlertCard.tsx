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
        bg: "bg-sky-50 border-sky-200 text-sky-900",
        btnText: "対策情報を確認",
        iconId: "mosquito",
      };
    } else if (region === "okinawa") {
      return {
        title: "ゴキブリ・ムカデ活性期 (沖縄)",
        desc: "沖縄エリア：温暖な気候のため通年で害虫発生リスクがあります。キッチン下や浴室配管の隙間など、侵入口の点検と防虫グッズの再配置を行ってください。",
        bg: "bg-red-50 border-red-200 text-red-950",
        btnText: "対策情報を確認",
        iconId: "cockroach",
      };
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      return {
        title: "梅雨・夏季の害虫活動警戒アラート",
        desc: "夏季警戒アラート：高温多湿の環境に入りました。ダニやゴキブリの活動期になりますので、寝具や水回りの対策グッズの設置・交換をお勧めします。",
        bg: "bg-amber-50 border-amber-200 text-amber-950",
        btnText: "推奨対策を確認",
        iconId: "tick",
      };
    } else {
      return {
        title: "秋冬の隙間侵入予防アラート",
        desc: "秋冬予防アラート：外気温の低下に伴い、暖かい室内への害虫の侵入が増加します。エアコン配管口やサッシの隙間の点検が有効です。",
        bg: "bg-slate-50 border-slate-200 text-slate-900",
        btnText: "予防対策を確認",
        iconId: "stinkbug",
      };
    }
  }, [region, currentMonth]);

  return (
    <div className={`border p-5 rounded-md mb-5 flex items-center justify-between gap-4 transition-colors ${alertInfo.bg}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="font-bold text-sm tracking-tight">{alertInfo.title}</h2>
        </div>
        <p className="text-[11px] leading-relaxed font-medium text-slate-700">
          {alertInfo.desc}
        </p>
        <Link
          href="/encyclopedia"
          className="inline-flex items-center mt-3 text-[10px] font-bold text-teal-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 shadow-sm transition"
        >
          {alertInfo.btnText} →
        </Link>
      </div>
      
      <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-sm flex-shrink-0">
        <PestIcon 
          id={alertInfo.iconId} 
          size={56} 
        />
      </div>
    </div>
  );
}

