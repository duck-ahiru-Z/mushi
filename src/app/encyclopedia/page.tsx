"use client";
import { useState } from "react";

export default function EncyclopediaPage() {
  const [selectedBug, setSelectedBug] = useState<string>("cockroach");

  // 虫ごとの図鑑データ
  const bugData: Record<string, { title: string; season: string; danger: string; text: string; goods: string[]; tips: string }> = {
    cockroach: {
      title: "🪳 ゴキブリ（クロゴキブリ・チャバネ）",
      season: "5月〜10月（25度以上で活発化）",
      danger: "高（繁殖力が非常に強い）",
      text: "湿気と暗い場所、食べ物の匂いを好みます。特にキッチンのシンク下や冷蔵庫の裏、洗面所の洗濯機の下が要注意スポットです。",
      goods: ["ゴキブリホイホイ（捕獲用）", "ブラックキャップ（毒餌・巣ごと全滅）"],
      tips: "間取りマップを使って、家の中の「水回り」と「壁際」に均等に罠を配置すると効果的です。"
    },
    tick: {
      title: "🕷️ ダニ（チリダニ・ツメダニ）",
      season: "6月〜8月（梅雨時期に爆発）",
      danger: "中（アレルギーの原因に）",
      text: "布団、じゅうたん、ソファなどの繊維の中に潜みます。人間のフケや垢が大好物で、湿度が70%を超えると一気に増殖します。",
      goods: ["ダニよけシート（置くだけ）", "ダニフマキラー（スプレー）"],
      tips: "寝室のベッドの四隅や、リビングのソファのクッションの下がピンポイントの設置推奨場所です。"
    },
    mosquito: {
      title: "🦟 蚊（ヒトスジシマカ）",
      season: "4月〜11月（ヤブ蚊に注意）",
      danger: "低〜中（かゆみ、感染症リスク）",
      text: "わずかな水たまり（植木鉢の受け皿、雨どいなど）から発生します。家の中へは玄関の開閉や網戸の隙間から侵入します。",
      goods: ["アースノーマット（リキッド式）", "虫コナーズ（ベランダ吊り下げ）"],
      tips: "玄関やベランダの窓際に吊り下げるグッズは、風上に設置すると家全体に成分が行き渡ります。"
    }
  };

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-50">
      <h1 className="text-xl font-bold border-b pb-2 mb-4 text-slate-800">🔍 地域・季節連動：虫対策図鑑</h1>
      
      <p className="text-xs text-slate-500 mb-4 bg-teal-50 text-teal-800 p-2.5 rounded-lg border border-teal-100">
        📍 現在の地域: <strong>近畿エリア</strong> の気候データを基に、5月に発生しやすい害虫を表示しています。
      </p>

      {/* タブ切り替えボタン */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setSelectedBug("cockroach")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedBug === "cockroach" ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-600 border"}`}
        >
          ゴキブリ
        </button>
        <button 
          onClick={() => setSelectedBug("tick")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedBug === "tick" ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-600 border"}`}
        >
          ダニ
        </button>
        <button 
          onClick={() => setSelectedBug("mosquito")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedBug === "mosquito" ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-600 border"}`}
        >
          蚊
        </button>
      </div>

      {/* 図鑑詳細カード */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800">{bugData[selectedBug].title}</h2>
          <div className="flex gap-4 mt-2 text-[11px]">
            <span className="text-slate-500">⏳ 警戒時期: <strong className="text-slate-700">{bugData[selectedBug].season}</strong></span>
            <span className="text-slate-500">🚨 危険度: <strong className="text-red-600">{bugData[selectedBug].danger}</strong></span>
          </div>
        </div>

        <div className="border-t pt-3">
          <h3 className="text-xs font-bold text-slate-400 mb-1">生態と特徴</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{bugData[selectedBug].text}</p>
        </div>

        <div className="border-t pt-3">
          <h3 className="text-xs font-bold text-slate-400 mb-1.5">有効な対策グッズ</h3>
          <div className="flex flex-col gap-1.5">
            {bugData[selectedBug].goods.map((g, i) => (
              <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs text-slate-700 font-medium flex items-center gap-2">
                <span className="text-teal-600">✓</span> {g}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-3 bg-teal-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl border-t-teal-100/50">
          <h3 className="text-xs font-bold text-teal-800 mb-1">💡 設置のプロのコツ</h3>
          <p className="text-xs text-teal-950 leading-relaxed">{bugData[selectedBug].tips}</p>
        </div>
      </div>
    </div>
  );
}