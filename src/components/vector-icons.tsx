"use client";
import React, { useState, useEffect } from "react";

interface IconProps {
  id: string;
  className?: string;
  size?: number;
}

/**
 * 🪳 12種類の害虫用の高品質フラットベクターSVGイラストレーション
 */
export const PestIcon: React.FC<IconProps> = ({ id, className = "", size = 48 }) => {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const checkDisabled = () => {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem("bug_illustrations_disabled");
        setIsDisabled(val === "true");
      }
    };
    checkDisabled();

    window.addEventListener("safeModeChanged", checkDisabled);
    return () => {
      window.removeEventListener("safeModeChanged", checkDisabled);
    };
  }, []);

  const svgProps = {
    className: `transition-transform duration-200 ${className}`,
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  };

  if (isDisabled) {
    return (
      <svg {...svgProps}>
        {/* セーフシールド：優しい緑の防衛シールド */}
        <path d="M32 8L12 18V34C12 46 24 52 32 56C40 52 52 46 52 34V18L32 8Z" fill="#10B981" fillOpacity="0.9" stroke="#059669" strokeWidth="3" />
        {/* 内側の白いチェックマーク */}
        <path d="M24 32L30 38L40 26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  switch (id) {
    case "cockroach":
      return (
        <svg {...svgProps}>
          {/* ゴキブリ: 茶色のスマートな幾何学シルエット */}
          <path d="M32 10C28 14 26 22 26 34C26 44 28 50 32 54C36 50 38 44 38 34C38 22 36 14 32 10Z" fill="#78350F" />
          <path d="M26 30C22 32 18 30 14 26" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 38C20 42 16 42 12 38" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 46C20 52 18 54 14 54" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 30C42 32 46 30 50 26" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 38C44 42 48 42 52 38" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 46C44 52 46 54 50 54" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          {/* 触角 */}
          <path d="M31 10C28 6 22 4 16 3" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <path d="M33 10C36 6 42 4 48 3" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="24" r="2" fill="#FBBF24" />
        </svg>
      );

    case "tick":
    case "bedbug":
    case "flea":
    case "clover_mite":
      return (
        <svg {...svgProps}>
          {/* ダニ: 扁平なグレーの円形ボディと細い脚 */}
          <ellipse cx="32" cy="36" rx="16" ry="18" fill="#4B5563" />
          <circle cx="32" cy="18" r="8" fill="#374151" />
          {/* 8本の脚 */}
          <path d="M20 32C12 30 10 24 8 18" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 38C10 38 8 36 6 32" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 44C10 48 8 48 6 46" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M22 48C16 54 14 56 12 56" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M44 32C52 30 54 24 56 18" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M46 38C54 38 56 36 58 32" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M46 44C54 48 56 48 58 46" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M42 48C48 54 50 56 52 56" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "mosquito":
      return (
        <svg {...svgProps}>
          {/* 蚊: シルバーの細身ボディと半透明の羽 */}
          <path d="M32 16L32 48" stroke="#6B7280" strokeWidth="4" strokeLinecap="round" />
          {/* 吸血針 */}
          <path d="M32 16L32 4" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
          {/* 羽 */}
          <ellipse cx="20" cy="24" rx="14" ry="5" fill="#93C5FD" fillOpacity="0.4" stroke="#60A5FA" strokeWidth="1.5" transform="rotate(-30 20 24)" />
          <ellipse cx="44" cy="24" rx="14" ry="5" fill="#93C5FD" fillOpacity="0.4" stroke="#60A5FA" strokeWidth="1.5" transform="rotate(30 44 24)" />
          {/* 脚 */}
          <path d="M29 32C24 34 20 38 18 46" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 32C40 34 44 38 46 46" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 40C24 46 20 52 18 60" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
          <path d="M34 40C40 46 44 52 46 60" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "fly":
    case "drain_fly":
      return (
        <svg {...svgProps}>
          {/* コバエ: 丸いフォルムと大きな赤い複眼 */}
          <circle cx="32" cy="34" r="14" fill="#374151" />
          <ellipse cx="32" cy="20" rx="8" ry="6" fill="#1F2937" />
          {/* 複眼 */}
          <circle cx="28" cy="18" r="3.5" fill="#EF4444" />
          <circle cx="36" cy="18" r="3.5" fill="#EF4444" />
          {/* 羽 */}
          <ellipse cx="20" cy="26" rx="12" ry="7" fill="#E5E7EB" fillOpacity="0.6" stroke="#9CA3AF" strokeWidth="1.5" transform="rotate(-45 20 26)" />
          <ellipse cx="44" cy="26" rx="12" ry="7" fill="#E5E7EB" fillOpacity="0.6" stroke="#9CA3AF" strokeWidth="1.5" transform="rotate(45 44 26)" />
        </svg>
      );

    case "ant":
    case "termite":
    case "fire_ant":
      return (
        <svg {...svgProps}>
          {/* アリ: 3つのセグメント（頭・胸・腹） */}
          <circle cx="32" cy="16" r="6" fill="#111827" />
          <circle cx="32" cy="28" r="5" fill="#111827" />
          <ellipse cx="32" cy="44" rx="8" ry="11" fill="#111827" />
          {/* 脚 */}
          <path d="M29 28C24 28 18 24 14 20" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 28C40 28 46 24 50 20" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <path d="M28 32C22 36 18 38 14 42" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 32C42 36 46 38 50 42" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "spider":
    case "red_back_spider":
      return (
        <svg {...svgProps}>
          {/* クモ: 幾何学的な8本脚 */}
          <ellipse cx="32" cy="22" rx="5" ry="6" fill="#4B5563" />
          <ellipse cx="32" cy="38" rx="8" ry="10" fill="#374151" />
          {/* 脚 */}
          <path d="M27 22C18 20 12 14 8 8" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
          <path d="M37 22C46 20 52 14 56 8" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
          <path d="M25 30C16 30 10 32 6 36" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 30C48 30 54 32 58 36" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
          <path d="M25 38C14 42 10 46 6 52" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 38C50 42 54 46 58 52" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "centipede":
      return (
        <svg {...svgProps}>
          {/* ムカデ: 蠍ではなく、本物の多足の幾何学的ムカデ！！ */}
          {/* うねるボディ */}
          <path d="M32 6C32 6 35 12 32 18C29 24 35 30 32 36C29 42 35 48 32 58" stroke="#B45309" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* 複数の対の脚 */}
          {[12, 18, 24, 30, 36, 42, 48, 54].map((y, i) => (
            <React.Fragment key={i}>
              <path d={`M30 ${y}C24 ${y - 2} 18 ${y - 1} 12 ${y}`} stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d={`M34 ${y}C40 ${y - 2} 46 ${y - 1} 52 ${y}`} stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />
            </React.Fragment>
          ))}
          {/* 頭部の触角 */}
          <path d="M30 6C26 2 20 1 16 2" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M34 6C38 2 44 1 48 2" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case "stinkbug":
      return (
        <svg {...svgProps}>
          {/* カメムシ: 美しい盾型の形状 */}
          <path d="M32 12L46 22L42 42L32 54L22 42L18 22L32 12Z" fill="#15803D" stroke="#166534" strokeWidth="2" />
          <path d="M32 12V54" stroke="#166534" strokeWidth="1.5" />
          <path d="M22 26H42" stroke="#166534" strokeWidth="1.5" />
          <circle cx="28" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="36" cy="20" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case "booklice":
    case "carpet_beetle":
    case "shiba_mushi":
    case "rice_weevil":
    case "silverfish":
      return (
        <svg {...svgProps}>
          {/* チャタテムシ: ベージュ系の微小虫 */}
          <ellipse cx="32" cy="38" rx="10" ry="14" fill="#D1C4E9" />
          <circle cx="32" cy="22" r="7" fill="#B39DDB" />
          <path d="M26 22C20 20 18 16 16 12" stroke="#9575CD" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M38 22C44 20 46 16 48 12" stroke="#9575CD" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M24 36H12" stroke="#9575CD" strokeWidth="2" />
          <path d="M38 36H50" stroke="#9575CD" strokeWidth="2" />
        </svg>
      );

    case "closet_pest":
      return (
        <svg {...svgProps}>
          {/* 衣類害虫（蛾）: 三角形の美しい羽フォルム */}
          <path d="M32 20L32 48" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          {/* 美しい有機的な蛾の羽 */}
          <path d="M32 24L10 38L16 48L32 38Z" fill="#D9F99D" stroke="#A7F3D0" strokeWidth="2" />
          <path d="M32 24L54 38L48 48L32 38Z" fill="#D9F99D" stroke="#A7F3D0" strokeWidth="2" />
          {/* 羽のテクスチャ */}
          <line x1="22" y1="33" x2="16" y2="44" stroke="#84CC16" strokeWidth="1.5" />
          <line x1="42" y1="33" x2="48" y2="44" stroke="#84CC16" strokeWidth="1.5" />
        </svg>
      );

    case "house_centipede":
      return (
        <svg {...svgProps}>
          {/* ゲジゲジ: 極細の極めて長い脚の多足虫 */}
          <ellipse cx="32" cy="30" rx="4" ry="16" fill="#6B7280" />
          {/* ゲジゲジ特有の細く長い脚のカーブ */}
          {[18, 22, 26, 30, 34, 38, 42].map((y, i) => (
            <React.Fragment key={i}>
              <path d={`M29 ${y}C18 ${y - 8} 10 ${y - 4} 4 ${y + 8}`} stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d={`M35 ${y}C46 ${y - 8} 54 ${y - 4} 60 ${y + 8}`} stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </React.Fragment>
          ))}
        </svg>
      );

    case "wasp":
    case "yellow_jacket":
      return (
        <svg {...svgProps}>
          {/* ハチ: 黄色と黒のボーダー腹部 */}
          <ellipse cx="32" cy="20" rx="6" ry="5" fill="#111827" />
          {/* 腹部のシマシマ */}
          <ellipse cx="32" cy="40" rx="9" ry="14" fill="#FBBF24" />
          <path d="M24 34C28 35 36 35 40 34" stroke="#111827" strokeWidth="3" />
          <path d="M23 41C28 42 36 42 41 41" stroke="#111827" strokeWidth="3" />
          <path d="M24 48C28 49 36 49 40 48" stroke="#111827" strokeWidth="3" />
          {/* 羽 */}
          <ellipse cx="18" cy="24" rx="14" ry="6" fill="#F3F4F6" fillOpacity="0.8" stroke="#D1D5DB" strokeWidth="1.5" transform="rotate(-35 18 24)" />
          <ellipse cx="46" cy="24" rx="14" ry="6" fill="#F3F4F6" fillOpacity="0.8" stroke="#D1D5DB" strokeWidth="1.5" transform="rotate(35 46 24)" />
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="20" fill="#9CA3AF" />
        </svg>
      );
  }
};

/**
 * 📦 6種類の防虫対策グッズ用の美しく機能的なベクターイラスト
 */
export const TrapIcon: React.FC<IconProps> = ({ id, className = "", size = 32 }) => {
  const [isMild, setIsMild] = useState(false);
  const [customIconKey, setCustomIconKey] = useState<string | null>(null);

  useEffect(() => {
    const checkSettings = () => {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem("bug_illustrations_disabled");
        setIsMild(val === "true");

        // カスタムグッズ種類リストから、id(トラップ名)に一致するアイコンキーを取得
        try {
          const savedCustomTypes = localStorage.getItem("custom_trap_types");
          if (savedCustomTypes) {
            const customTypes = JSON.parse(savedCustomTypes);
            const found = customTypes.find((t: any) => t.name === id);
            if (found) {
              setCustomIconKey(found.icon);
            }
          }
        } catch {}
      }
    };
    checkSettings();

    window.addEventListener("safeModeChanged", checkSettings);
    window.addEventListener("trapsChanged", checkSettings);
    return () => {
      window.removeEventListener("safeModeChanged", checkSettings);
      window.removeEventListener("trapsChanged", checkSettings);
    };
  }, [id]);

  const svgProps = {
    className: `transition-transform duration-200 ${className}`,
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  };

  // マイルドモード時は強制的にシールドを描画
  if (isMild) {
    return (
      <svg {...svgProps}>
        <path d="M24 6L6 14V26C6 36 14 41 24 44C34 41 42 36 42 26V14L24 6Z" fill="#10B981" stroke="#059669" strokeWidth="2.5" />
        <path d="M24 16L27 22H33L29 26L31 32L24 28L17 32L19 26L15 22H21L24 16Z" fill="#FFFFFF" />
      </svg>
    );
  }

  // アクティブなアイコン識別キー（カスタムグッズのアイコンキーがある場合はそれを優先）
  const activeIconKey = customIconKey || id;

  switch (activeIconKey) {
    case "ゴキブリホイホイ":
    case "🪳":
    case "cockroach":
      return (
        <svg {...svgProps}>
          {/* 3D風の段ボールハウス型トラップ */}
          <path d="M6 34L24 42L42 34V18L24 10L6 18V34Z" fill="#F59E0B" fillOpacity="0.8" stroke="#D97706" strokeWidth="2.5" />
          <path d="M6 18L24 26L42 18" stroke="#D97706" strokeWidth="2.5" />
          <path d="M24 10V26V42" stroke="#D97706" strokeWidth="2.5" />
          {/* 出入口の黒いスリット */}
          <path d="M12 33L20 37V30L12 26V33Z" fill="#78350F" />
          <path d="M36 33L28 37V30L36 26V33Z" fill="#78350F" />
        </svg>
      );

    case "ブラックキャップ":
    case "🪙":
    case "coin":
      return (
        <svg {...svgProps}>
          {/* 漆黒のスマートな円形ドーム型ベイト剤 */}
          <circle cx="24" cy="24" r="20" fill="#1F2937" stroke="#111827" strokeWidth="3" />
          <circle cx="24" cy="24" r="12" fill="#374151" />
          {/* 側面の侵入口スリットデザイン */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1="24"
              y1="4"
              x2="24"
              y2="10"
              stroke="#F59E0B"
              strokeWidth="2"
              transform={`rotate(${angle} 24 24)`}
            />
          ))}
        </svg>
      );

    case "ダニよけシート":
    case "📦":
    case "box":
      return (
        <svg {...svgProps}>
          {/* グリッド加工された水色の不織布ダニ捕りシート */}
          <rect x="6" y="6" width="36" height="36" rx="4" fill="#93C5FD" fillOpacity="0.9" stroke="#3B82F6" strokeWidth="2.5" />
          <line x1="6" y1="18" x2="42" y2="18" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="6" y1="30" x2="42" y2="30" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="18" y1="6" x2="18" y2="42" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="30" y1="6" x2="30" y2="42" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* 中央のダニ寄せマーク（緑のクローバー/ターゲット風） */}
          <circle cx="24" cy="24" r="6" stroke="#10B981" strokeWidth="2" />
          <circle cx="24" cy="24" r="2" fill="#10B981" />
        </svg>
      );

    case "コバエがいなくなるスプレー":
    case "🧴":
    case "spray":
      return (
        <svg {...svgProps}>
          {/* スプレーボトルスプレーミスト */}
          <rect x="18" y="18" width="12" height="24" rx="3" fill="#14B8A6" stroke="#0D9488" strokeWidth="2.5" />
          <path d="M21 18V12H27V18" stroke="#0D9488" strokeWidth="2.5" />
          <path d="M27 10L29 12" stroke="#0D9488" strokeWidth="2.5" />
          {/* 噴射ミスト */}
          <circle cx="34" cy="10" r="2" fill="#67E8F9" />
          <circle cx="39" cy="8" r="3" fill="#67E8F9" />
          <circle cx="38" cy="14" r="1.5" fill="#67E8F9" />
        </svg>
      );

    case "アリの巣コロリ":
    case "🐜":
    case "ant":
      return (
        <svg {...svgProps}>
          {/* アリの侵入口付き緑の薄型トレイ */}
          <rect x="6" y="14" width="36" height="20" rx="3" fill="#10B981" stroke="#059669" strokeWidth="2.5" />
          {/* アリの通り口スリット */}
          <rect x="12" y="20" width="6" height="8" rx="1" fill="#065F46" />
          <rect x="30" y="20" width="6" height="8" rx="1" fill="#065F46" />
          {/* 顆粒・ゼリーの二層ベイトデザイン */}
          <circle cx="15" cy="24" r="2" fill="#FBBF24" />
          <circle cx="33" cy="24" r="2" fill="#EF4444" />
        </svg>
      );

    case "🕷️":
    case "spider":
    case "tick":
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.5" />
          <path d="M24 10V38M10 24H38" stroke="#10B981" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="24" cy="24" r="8" fill="#10B981" />
          <path d="M20 20L14 14M28 20L34 14M20 28L14 34M28 28L34 34" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "🌿":
    case "herb":
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" fill="#F0FDF4" stroke="#22C55E" strokeWidth="2.5" />
          <path d="M24 34C24 34 20 28 20 24C20 20 24 14 24 14C24 14 28 20 28 24C28 28 24 34 24 34Z" fill="#22C55E" />
          <path d="M24 34V14" stroke="#15803D" strokeWidth="1.5" />
          <path d="M24 24C24 24 17 21 16 18C15 15 20 16 20 16" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 28C24 28 31 25 32 22C33 19 28 20 28 20" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "🦟":
    case "mosquito":
    case "fly":
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" fill="#F0FDFA" stroke="#0D9488" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="6" fill="#0D9488" />
          <path d="M18 20C18 16 24 18 24 18C24 18 30 16 30 20" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 24H34" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          {/* デフォルトのスタイリッシュな盾マーク */}
          <path d="M24 6L6 14V26C6 36 14 41 24 44C34 41 42 36 42 26V14L24 6Z" fill="#14B8A6" stroke="#0D9488" strokeWidth="2.5" />
          <path d="M24 16L27 22H33L29 26L31 32L24 28L17 32L19 26L15 22H21L24 16Z" fill="#FFFFFF" />
        </svg>
      );
  }
};
