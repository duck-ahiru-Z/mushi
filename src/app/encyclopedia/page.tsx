"use client";
import { useState, useEffect, useMemo } from "react";
import { detectPrefecture, PREFECTURE_COORDINATES } from "@/lib/utils";
import { PestIcon, TrapIcon } from "@/components/vector-icons";

interface BugProfile {
  id: string;
  name: string;
  emoji: string;
  activeMonths: number[]; // 標準的な活動月
  danger: "high" | "medium" | "low";
  description: string;
  hidingSpot: string;
  goods: string[];
  tips: string;
}

const BUG_DATABASE: BugProfile[] = [
  {
    id: "cockroach",
    name: "ゴキブリ（クロ・チャバネ）",
    emoji: "🪳",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "high",
    description: "暗く、暖かく、湿気の多い隙間を好みます。1匹見かけると数十匹潜んでいる可能性があり、繁殖力が極めて高い衛生害虫です。",
    hidingSpot: "キッチンのシンク下、冷蔵庫の裏、電子レンジの底、洗面台の配管隙間",
    goods: ["ゴキブリホイホイ（捕獲用）", "ブラックキャップ（毒餌剤・巣ごと退治）", "ゴキジェットプロ（即効スプレー）"],
    tips: "ブラックキャップを「壁際」や「家電の温かい裏」に多めに置くことで、巣に持ち帰らせて全滅を狙うのが最も効果的です。"
  },
  {
    id: "tick",
    name: "ダニ（チリダニ・ツメダニ）",
    emoji: "🕷️",
    activeMonths: [6, 7, 8, 9],
    danger: "medium",
    description: "湿度60%以上、気温25度以上で急激に繁殖します。人間のフケやアカをエサにし、死骸や糞が喘息などのアレルギーの原因になります。",
    hidingSpot: "布団、じゅうたん、ソファの隙間、ぬいぐるみ、クローゼット",
    goods: ["ダニよけシート（敷くだけ）", "ダニスプレー（駆除＋防ダニ効果）"],
    tips: "布団の頭側や足元のシーツ下に「ダニよけシート」を設置すると、繊維からダニを追い出して寄せ付けなくなります。"
  },
  {
    id: "mosquito",
    name: "蚊（アカイエカ・ヒトスジシマカ）",
    emoji: "🦟",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "medium",
    description: "わずかな水たまりからボウフラが発生します。玄関の開閉や網戸の隙間から侵入し、吸血時にかゆみや感染症のリスクを引き起こします。",
    hidingSpot: "玄関付近の壁、観葉植物の陰、エアコンのドレン管付近、ベランダの隅",
    goods: ["アースノーマット（液体蚊とり）", "虫コナーズ（玄関・ベランダ吊り下げ型）"],
    tips: "ベランダの窓際や玄関ドアの外側に「吊り下げ型」を設置する際は、風上に置くことで成分が家側に流れて侵入を防ぎます。"
  },
  {
    id: "fly",
    name: "コバエ（ショウジョウバエ・チョウバエ）",
    emoji: "🪰",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "low",
    description: "生ゴミや腐敗した果物、シンクのヌメリ、排水溝の有機物から発生します。驚異的な速さで産卵し、室内を飛び回ります。",
    hidingSpot: "三角コーナー、ゴミ箱のフタ裏、観葉植物の受け皿、浴室の排水口",
    goods: ["コバエがホイホイ（ゼリー罠）", "コバエがいなくなるスプレー（ゴミ箱用）"],
    tips: "ショウジョウバエは甘酢っぱい匂い（ゼリー罠）に惹かれますが、排水口のチョウバエにはスプレーや熱湯によるヌメリ清掃が一番です。"
  },
  {
    id: "ant",
    name: "アリ（クロアリ・ルリアリ）",
    emoji: "🐜",
    activeMonths: [4, 5, 6, 7, 8, 9, 10],
    danger: "medium",
    description: "庭の巣から餌を求めて、サッシの隙間やエアコンの配管スリーブから列をなして室内に侵入します。糖分や食品クズに集まります。",
    hidingSpot: "窓のアルミサッシ下、壁の巾木（はばき）の隙間、キッチンの調味料置き場",
    goods: ["アリの巣コロリ（毒餌皿）", "アリアース（侵入路スプレー）"],
    tips: "アリの通り道（行列）の先頭付近に「アリの巣コロリ」を置きます。通り道をスプレーで消すと、仲間を呼ぶフェロモンが消えて効果的です。"
  },
  {
    id: "spider",
    name: "クモ（アシダカグモ・ハエトリグモ）",
    emoji: "🕷️",
    activeMonths: [5, 6, 7, 8, 9],
    danger: "low",
    description: "家の中の害虫（ゴキブリやコバエ）を食べてくれる「益虫」ですが、見た目の不快感やクモの巣が嫌がられます。有毒なセアカゴケグモには注意。",
    hidingSpot: "天井の隅、家具の隙間、下駄箱の下、窓の外枠",
    goods: ["クモの巣消滅ジェット（防巣スプレー）", "凍殺ジェット（殺虫成分なしで固める）"],
    tips: "部屋に侵入するクモを減らすためには、餌となるコバエや蚊を「G-End」で徹底的になくすのが一番の根本対策です。"
  },
  {
    id: "centipede",
    name: "ムカデ（トビズムカデ）",
    emoji: "🦂",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "high",
    description: "湿気があり暗く、落ち葉や小石の下を好みます。夜間にゴキブリやクモなどのエサを求め、サッシの隙間や排水口から侵入し、噛まれると激痛が走ります。",
    hidingSpot: "風呂場の床、玄関のタタキ、脱衣所のすのこ下、ベッドの下",
    goods: ["ムカデコロリ（置くだけ毒餌）", "ムカデシャット（屋外境界線粉末）"],
    tips: "家の基礎まわりに「粉末・粒状の境界線薬」を撒き、床下の通気口や浴室の排水管の周囲など湿気の多い場所に毒餌を先回りして置くのが基本です。"
  },
  {
    id: "stinkbug",
    name: "カメムシ（クサギカメムシ）",
    emoji: "🛡️",
    activeMonths: [4, 5, 9, 10, 11],
    danger: "medium",
    description: "暖かく日当たりの良い場所を好み、秋になると越冬場所を探して大集団で飛来し、網戸の隙間から侵入。刺激すると強烈な悪臭を放ちます。",
    hidingSpot: "干した洗濯物、白い外壁、サッシの隙間、クローゼットの中",
    goods: ["カメムシコロリ（凍殺スプレー）", "カメムシよけ吊り下げ型"],
    tips: "カメムシは洗濯物（特に白系）に付着して室内に持ち込まれることが多いです。取り込む前に軽く払い、網戸に防虫スプレーを吹き付けましょう。"
  },
  {
    id: "booklice",
    name: "チャタテムシ",
    emoji: "🐜",
    activeMonths: [6, 7, 8, 9],
    danger: "low",
    description: "体長1mm程度の超小型虫で、アリの幼虫に似ています。カビを主食とし、段ボール、古紙、壁紙の裏で繁殖し、アレルギーの原因になります。",
    hidingSpot: "湿った段ボール箱、古い書籍、押し入れの奥、畳の継ぎ目",
    goods: ["バルサン（部屋丸ごと煙）", "除湿剤（カビを抑えるための必須品）"],
    tips: "通販の段ボールはカビや卵が付着しやすいため、届いたらすぐに解体して室内に放置しないことが最大の予防法です。"
  },
  {
    id: "closet_pest",
    name: "衣類害虫（イガ・コイガ・カツオブシムシ）",
    emoji: "🦋",
    activeMonths: [4, 5, 6, 7, 8, 9],
    danger: "medium",
    description: "タンスやクローゼットに忍び込み、卵を産みます。孵化した幼虫がウールやカシミヤなどの天然高級繊維を食べ、衣類に穴をあけます。",
    hidingSpot: "衣装ケースの底、タンスの引き出し、防虫剤の切れたハンガー",
    goods: ["ムシューダ（無臭防虫剤）", "ゴンゴン（引き出し用）"],
    tips: "防虫成分は空気より重いため、引き出し用は衣類の一番「上」に置くことで、成分が底に向かって全体に行き渡ります。"
  },
  {
    id: "house_centipede",
    name: "ゲジゲジ（オオゲジ・ゲジ）",
    emoji: "🐛",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "low",
    description: "無数の長い脚を持ち、極めて素早い「不快害虫」ですが、毒はほとんどなく人には無害です。ゴキブリやダニを捕食する有能なハンターです。",
    hidingSpot: "床下、洗面台シンク下、押し入れの隅、床下収納の周り",
    goods: ["不快害虫スプレー", "シャットアウト（外壁用境界粉剤）"],
    tips: "ゲジゲジが現れるのは、室内に大好物である「ゴキブリやクモ」がいる証拠です。ゴキブリ対策を強化すれば自然とゲジゲジも姿を消します。"
  },
  {
    id: "wasp",
    name: "スズメバチ・アシナガバチ",
    emoji: "🐝",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "high",
    description: "春先から女王蜂が巣を作り始め、夏から秋にかけて働き蜂が急増し凶暴化します。刺されるとアナフィラキシーショックで命に関わる高危険害虫です。",
    hidingSpot: "軒下、ベランダの天井隅、エアコン室外機の裏、庭木の中",
    goods: ["ハチの巣を作らせないスプレー", "ハチ激取れ（吊り下げ粘着罠）"],
    tips: "4月〜5月の春先にベランダの軒下などに「防巣スプレー」を撒いておくと、女王蜂が巣作りをあきらめて避けていきます。"
  },
  {
    id: "termite",
    name: "シロアリ",
    emoji: "🐜",
    activeMonths: [4, 5, 6, 7],
    danger: "high",
    description: "木材を主食とする昆虫で、家の土台や柱などの木造構造部を食い荒らし、建物の耐震性を致命的に低下させる深刻な構造物害虫です。",
    hidingSpot: "床下の基礎木材、湿った柱の内部、浴室や玄関周辺の湿気がこもる壁裏",
    goods: ["シロアリ防除スプレー", "床下調湿剤（防湿対策）"],
    tips: "羽アリが春先（4〜5月）に大量に飛び立つのは、近くに巨大なシロアリの巣がある証拠です。早めの点検と床下の乾燥・防除剤散布が有効です。"
  },
  {
    id: "bedbug",
    name: "トコジラミ（ナンキンムシ）",
    emoji: "🕷️",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "high",
    description: "旅行や荷物に付着して室内に持ち込まれる寄生虫です。夜間に人が寝ている間に激しく吸血し、眠れないほどの猛烈なかゆみをもたらします。",
    hidingSpot: "ベッドマットの縫い目、敷き布団の折り目、木製ベッドのフレーム隙間、壁紙の剥がれ裏",
    goods: ["トコジラミ専用殺虫スプレー", "粘着罠シート"],
    tips: "一般の殺虫剤（ピレスロイド系）に耐性を持つスーパー トコジラミが急増しています。専用のスプレーを使うか、高熱（スチームアイロン等）による熱殺虫が有効です。"
  },
  {
    id: "flea",
    name: "ノミ（ネコノミ）",
    emoji: "🕷️",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "medium",
    description: "ペットや野生動物を経由して家の中に侵入します。非常に強力に跳躍し、人間の足元やペットを噛んで赤い激しいかゆみを引き起こします。",
    hidingSpot: "ペット用ベッド、カーペットやじゅうたんの繊維奥、畳の隙間",
    goods: ["ノミとりホイホイ（電子誘引罠）", "ペット用防ノミ薬"],
    tips: "バルサンなどの燻煙剤で部屋全体を処理するとともに、ペットがいる場合は動物病院で処方される月1回のスポット薬で予防するのが最も効果的です。"
  },
  {
    id: "carpet_beetle",
    name: "カツオブシムシ",
    emoji: "🐛",
    activeMonths: [4, 5, 6],
    danger: "medium",
    description: "幼虫の時期にウールやカシミヤなどの衣類天然繊維を食い荒らすほか、鰹節や乾燥煮干し、ペットフードなどの乾燥食品にも発生します。",
    hidingSpot: "クローゼット奥のタンス引き出し、乾燥食品ストックの隅、畳の下",
    goods: ["防虫剤（衣類用）", "食品密封用ジッパー袋"],
    tips: "成虫は春に白い花に集まる習性があり、洗濯物にくっついて室内に侵入し産卵します。衣類の防虫剤を正しく配置し、食品は密封保存しましょう。"
  },
  {
    id: "shiba_mushi",
    name: "シバンムシ",
    emoji: "🐜",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "low",
    description: "体長2mm程度の丸っこい茶色の甲虫です。小麦粉、ホットケーキミックス、そば粉、七味唐辛子、乾燥パスタ、さらにはタバコや畳まで食害します。",
    hidingSpot: "開封済みの調味料入れ、キッチンの乾物ストック棚、畳の隙間",
    goods: ["バルサン（殺虫）", "密閉保存容器（乾燥剤入り）"],
    tips: "一度発生すると食品パッケージを食い破って繁殖します。開封済みの粉ものや乾物はジッパー袋ではなく、タッパー等の密閉容器に入れて冷蔵庫保管しましょう。"
  },
  {
    id: "rice_weevil",
    name: "コクゾウムシ（米食い虫）",
    emoji: "🐜",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "low",
    description: "ゾウの鼻のような頭部を持つ微小甲虫です。お米に穴をあけてその中に卵を産み、孵化した幼虫がお米の内側を食べて中身を空っぽにします。",
    hidingSpot: "米びつの中、未開封の米袋、古いお米のストック",
    goods: ["米唐番（お米専用防虫剤）", "除湿剤"],
    tips: "お米の保存容器に唐辛子成分の「米唐番」などを入れておくか、お米を購入したらすぐに冷蔵庫の野菜室で保管することで発生を完全に防げます。"
  },
  {
    id: "red_back_spider",
    name: "セアカゴケグモ",
    emoji: "🕷️",
    activeMonths: [5, 6, 7, 8, 9, 10],
    danger: "high",
    description: "背中に赤い帯状の模様がある特定外来生物の毒グモです。温かく日当たりの良い屋外の隙間に巣を作ります。噛まれると神経毒により激しい痛みが生じます。",
    hidingSpot: "屋外のエアコン室外機の裏、自動販売機の底隙間、プランターの縁裏、側溝のグレーチング裏",
    goods: ["クモ駆除スプレー", "凍殺スプレー"],
    tips: "攻撃性は低く触らなければ噛まれませんが、屋外作業時は軍手を着用し、植木鉢の裏などに手を突っ込む際はクモの巣がないか事前に確認してください。"
  },
  {
    id: "drain_fly",
    name: "チョウバエ",
    emoji: "🪰",
    activeMonths: [5, 6, 7, 8, 9, 10, 11],
    danger: "low",
    description: "浴室や洗面所の排水口、洗濯機のパンなどに溜まる『スカム（有機物のヌメリ泥）』から発生します。逆ハート型の灰黒色の小さな虫で、壁に静止します。",
    hidingSpot: "浴室の浴槽エプロン裏、排水管のヌメリ内部、洗面所のオーバーフロー穴",
    goods: ["コバエ用泡スプレー（除菌・殺虫）", "排水口ヌメリ取りクリーナー"],
    tips: "成虫にスプレーをかけるだけでなく、発生源である排水口や浴槽の下（エプロン内）の泥・ヌメリを塩素系洗剤や熱湯で綺麗に洗浄するのが本質的です。"
  },
  {
    id: "yellow_jacket",
    name: "アシナガバチ",
    emoji: "🐝",
    activeMonths: [4, 5, 6, 7, 8, 9, 10],
    danger: "high",
    description: "スズメバチに比べて少し大人しいですが、非常に強力な毒を持ち、刺されると激痛とともにアレルギー症状を起こす危険なハチです。指示器型の巣を作ります。",
    hidingSpot: "ベランダの天井隅、エアコンの室外機下、庭木の葉の裏、軒下",
    goods: ["ハチ駆除超激スプレー", "ハチの巣作らせない防虫剤"],
    tips: "春（4〜5月）にベランダを飛び回る大きなハチは巣作り場所を探す女王蜂です。この時期にベランダ天井などに防巣スプレーを撒くと予防効果が絶大です。"
  },
  {
    id: "fire_ant",
    name: "ヒアリ",
    emoji: "🐜",
    activeMonths: [6, 7, 8, 9, 10],
    danger: "high",
    description: "強い毒バリを持つ赤い小型のアリで、刺されると火傷のような激しい痛みとアナフィラキシーショックを引き起こす危険外来生物です。",
    hidingSpot: "アスファルトの隙間、公園 of 芝生、港湾近くの温かい土壌",
    goods: ["アリの巣コロリ（毒餌剤）", "液体アリ用殺虫剤"],
    tips: "もしヒアリらしき赤いアリの行列を見つけても、絶対に素手で触らず、踏み潰さないでください。アリ用のベイト毒餌剤を置くか、役所等へ速やかに連絡します。"
  },
  {
    id: "clover_mite",
    name: "タカラダニ",
    emoji: "🕷️",
    activeMonths: [5, 6],
    danger: "low",
    description: "春先（5月頃）に外壁やコンクリート、ベランダの手すりを忙しく動き回る真っ赤な微小なダニです。人体を刺すことはありませんが、潰すと赤い汁が付着します。",
    hidingSpot: "日当たりの良い外壁の凹凸、ベランダの手すり、窓サッシの外側",
    goods: ["虫よけ外壁スプレー", "水での洗い流し（高圧洗浄）"],
    tips: "コンクリート表面の苔や花粉をエサにしています。ベランダなどを水でよく洗い流して苔を除去するか、窓周りに防虫スプレーをかけておくと侵入を防げます。"
  },
  {
    id: "silverfish",
    name: "シミ（紙魚）",
    emoji: "🐜",
    activeMonths: [4, 5, 6, 7, 8, 9, 10],
    danger: "low",
    description: "「紙の魚」と呼ばれるように、銀色の平らな体で魚のようにうねって走る非常に原始的な虫です。糊や紙が大好物で、本や障子、壁紙をかじります。",
    hidingSpot: "本棚の古い書籍の隙間、押し入れの段ボール裏、古い壁紙の裏隙間",
    goods: ["除湿剤（押し入れ用）", "防虫・防カビスプレー"],
    tips: "湿度が高く暗い場所を好むため、定期的な換気と押し入れの「除湿」が最大の予防策です。段ボールは湿気を吸いやすいため放置せず処分しましょう。"
  }
];

const REGIONS = [
  { id: "hokkaido", name: "北海道エリア", modifier: -1 },
  { id: "tohoku", name: "東北エリア", modifier: -0.5 },
  { id: "kanto", name: "関東エリア", modifier: 0 },
  { id: "chubu", name: "中部エリア", modifier: 0 },
  { id: "kinki", name: "近畿・関西エリア", modifier: 0 },
  { id: "chugoku", name: "中国エリア", modifier: 0 },
  { id: "shikoku", name: "四国エリア", modifier: 0.5 },
  { id: "kyushu", name: "九州エリア", modifier: 1 },
  { id: "okinawa", name: "沖縄エリア", modifier: 3 },
];

export default function EncyclopediaPage() {
  const [selectedBugId, setSelectedBugId] = useState<string>("cockroach");
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [region, setRegion] = useState<string>("kinki");
  const [prefectureName, setPrefectureName] = useState<string>("大阪府");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
    const savedRegion = localStorage.getItem("user_region");
    const savedPref = localStorage.getItem("user_prefecture");
    if (savedRegion) {
      setRegion(savedRegion);
    }
    if (savedPref) {
      setPrefectureName(savedPref);
    } else {
      if (savedRegion) {
        const found = PREFECTURE_COORDINATES.find(p => p.region === savedRegion);
        if (found) setPrefectureName(found.name);
      }
    }
  }, []);

  const handleDetectLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const closestPref = detectPrefecture(lat, lon);
          
          setRegion(closestPref.region);
          setPrefectureName(closestPref.name);
          localStorage.setItem("user_region", closestPref.region);
          localStorage.setItem("user_prefecture", closestPref.name);
          
          window.dispatchEvent(new Event("regionChanged"));
        },
        (error) => {
          alert("位置情報の取得に失敗しました。ブラウザの位置情報許可設定をご確認ください。");
          console.warn("Geolocation fallback in encyclopedia:", error);
        }
      );
    } else {
      alert("お使いのデバイスは位置情報機能に対応していません。");
    }
  };

  const getTrapIdFromText = (text: string): string => {
    if (text.includes("ゴキブリホイホイ")) return "ゴキブリホイホイ";
    if (text.includes("ブラックキャップ")) return "ブラックキャップ";
    if (text.includes("ダニよけシート")) return "ダニよけシート";
    if (text.includes("スプレー")) return "コバエがいなくなるスプレー";
    if (text.includes("アリの巣コロリ")) return "アリの巣コロリ";
    return "custom";
  };

  const activeRegionObj = useMemo(() => {
    return REGIONS.find((r) => r.id === region) || REGIONS[4];
  }, [region]);

  const scoredBugs = useMemo(() => {
    return BUG_DATABASE.map((bug) => {
      const isBaseActive = bug.activeMonths.includes(currentMonth);
      const modifier = activeRegionObj.modifier;
      
      let finalActive = isBaseActive;
      if (modifier > 0) {
        const prevMonth = bug.activeMonths[0] - 1 || 12;
        const nextMonth = bug.activeMonths[bug.activeMonths.length - 1] + 1 || 1;
        if (currentMonth === prevMonth || currentMonth === nextMonth) {
          finalActive = true;
        }
        if (region === "okinawa" && (
          bug.id === "cockroach" || 
          bug.id === "tick" || 
          bug.id === "mosquito" || 
          bug.id === "ant" ||
          bug.id === "bedbug" ||
          bug.id === "red_back_spider"
        )) {
          finalActive = true;
        }
      } else if (modifier < 0) {
        if (currentMonth === bug.activeMonths[0] || currentMonth === bug.activeMonths[bug.activeMonths.length - 1]) {
          finalActive = false;
        }
      }

      let threatLevel: "high" | "medium" | "low" | "none" = "none";
      if (finalActive) {
        threatLevel = bug.danger;
      } else {
        const isClose = bug.activeMonths.some((m) => Math.abs(m - currentMonth) <= 1 || Math.abs(m - currentMonth) === 11);
        if (isClose) {
          threatLevel = "low";
        }
      }

      return {
        ...bug,
        threatLevel,
        isCurrentlyActive: finalActive,
      };
    });
  }, [currentMonth, region, activeRegionObj]);

  const sortedBugs = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2, none: 3 };
    return [...scoredBugs].sort((a, b) => order[a.threatLevel] - order[b.threatLevel]);
  }, [scoredBugs]);

  const selectedBug = useMemo(() => {
    return sortedBugs.find((b) => b.id === selectedBugId) || sortedBugs[0];
  }, [sortedBugs, selectedBugId]);

  if (!isInitialized) {
    return (
      <div className="p-5 flex flex-col min-h-screen bg-slate-950 text-cyan-400 font-mono text-xs items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border border-cyan-500 border-t-transparent"></div>
        <span>LOADING TACTICAL DATABASE / 図鑑データベースロード中...</span>
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col min-h-screen bg-slate-950 text-zinc-100">
      {/* ヘッダー */}
      <div className="border-b border-zinc-800 pb-3 mb-5">
        <h1 className="text-xl font-black text-cyan-400 flex items-center gap-2 tracking-wide uppercase font-mono">
          📁 DEFENSE ENCYCLOPEDIA / 対策図鑑
        </h1>
        <p className="text-[9px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">
          Tactical Pest Database - Sorted by local region climate risk
        </p>
      </div>

      {/* 都道府県・月選択カード */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-5 rounded-3xl mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">DEFENSE PREFECTURE / 警報都道府県</label>
            <button
              onClick={handleDetectLocation}
              className="text-[9px] font-black text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-850 hover:bg-cyan-900/40 transition flex items-center gap-1 active:scale-[0.98] font-mono"
            >
              GPS AUTOMATIC DETECT
            </button>
          </div>
          <select
            value={prefectureName}
            onChange={(e) => {
              const prefName = e.target.value;
              setPrefectureName(prefName);
              const found = PREFECTURE_COORDINATES.find(p => p.name === prefName);
              if (found) {
                setRegion(found.region);
                localStorage.setItem("user_region", found.region);
                localStorage.setItem("user_prefecture", found.name);
                window.dispatchEvent(new Event("regionChanged"));
              }
            }}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {PREFECTURE_COORDINATES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({
                  p.region === "hokkaido" ? "北海道管区" :
                  p.region === "tohoku" ? "東北管区" :
                  p.region === "kanto" ? "関東管区" :
                  p.region === "chubu" ? "中部管区" :
                  p.region === "kinki" ? "近畿管区" :
                  p.region === "chugoku" ? "中国管区" :
                  p.region === "shikoku" ? "四国管区" :
                  p.region === "kyushu" ? "九州管区" : "沖縄管区"
                })
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">TARGET MONTH / 対象月</label>
            <span className="text-[10px] font-black text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-900/60 font-mono">{currentMonth}月</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-3"
          />
        </div>
      </div>

      {/* 管区判定ステータステキスト */}
      <div className="bg-cyan-950/30 border border-cyan-900/60 p-3 rounded-2xl text-[11px] text-cyan-300 leading-relaxed mb-5 font-mono">
        <strong>管区警戒ステータス:</strong> {prefectureName}における {currentMonth} 月の気候データを分析完了。現在、{scoredBugs.filter(b => b.threatLevel === "high" || b.threatLevel === "medium").length} 種の侵入害虫が要注意（Danger-Class）レベルに指定されています。
      </div>

      {/* グリッドレイアウト */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* 左側: リスト */}
        <div className="md:col-span-5 bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-3 rounded-2xl shadow-sm max-h-[60vh] md:max-h-[75vh] overflow-y-auto space-y-1">
          <h2 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 pb-2 border-b border-zinc-800 mb-2 font-mono">THREAT LIST / 害虫リスト</h2>
          {sortedBugs.map((bug) => {
            const isSelected = bug.id === selectedBugId;
            let badgeBg = "bg-zinc-950 text-zinc-500 border-zinc-850";
            let badgeText = "静穏";
            if (bug.threatLevel === "high") {
              badgeBg = "bg-red-950/50 text-red-400 border-red-900/60";
              badgeText = "最警戒";
            } else if (bug.threatLevel === "medium") {
              badgeBg = "bg-amber-950/50 text-amber-400 border-amber-900/60";
              badgeText = "要注意";
            } else if (bug.threatLevel === "low") {
              badgeBg = "bg-cyan-950/50 text-cyan-400 border-cyan-900/60";
              badgeText = "低警戒";
            }

            return (
              <button
                key={bug.id}
                onClick={() => setSelectedBugId(bug.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all duration-150 border ${
                  isSelected ? "bg-cyan-500 text-zinc-950 border-cyan-400 font-extrabold scale-[1.01] shadow-md" : "hover:bg-zinc-800/60 text-zinc-300 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PestIcon id={bug.id} size={28} className={isSelected ? "brightness-0" : ""} />
                  <span className="text-xs font-bold font-sans">{bug.name}</span>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border tracking-wider font-mono ${isSelected ? "bg-zinc-950 text-cyan-400 border-transparent" : badgeBg}`}>
                  {badgeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* 右側：選択された害虫の詳細カード */}
        <div className="md:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden flex flex-col min-h-[450px]">
          {/* カード上部 */}
          <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 p-5 text-zinc-100 flex justify-between items-center gap-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-black text-zinc-100">{selectedBug.name}</h2>
              <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                ACTIVE MONTHS: {selectedBug.activeMonths.join(", ")}月
              </p>
              
              <div className="mt-3">
                {selectedBug.threatLevel === "high" && (
                  <span className="text-[9px] font-black bg-red-950 border border-red-800 text-red-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    HIGH RISK / 厳重警戒対象
                  </span>
                )}
                {selectedBug.threatLevel === "medium" && (
                  <span className="text-[9px] font-black bg-amber-950 border border-amber-800 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    MEDIUM RISK / 要注意対象
                  </span>
                )}
                {selectedBug.threatLevel === "low" && (
                  <span className="text-[9px] font-black bg-cyan-950 border border-cyan-800 text-cyan-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    LOW RISK / 低度警戒対象
                  </span>
                )}
                {selectedBug.threatLevel === "none" && (
                  <span className="text-[9px] font-bold bg-zinc-950 border border-zinc-800 text-zinc-500 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    SAFE / シーズン外
                  </span>
                )}
              </div>
            </div>
            
            {/* 右側大型ベクターアイコン */}
            <div className="bg-zinc-950/80 p-2.5 rounded-2xl border border-zinc-800 shadow-inner flex-shrink-0">
              <PestIcon id={selectedBug.id} size={64} />
            </div>
          </div>

          {/* カードボディ */}
          <div className="p-5 flex-1 flex flex-col gap-4 text-xs">
            <div>
              <h3 className="font-black text-zinc-500 text-[9px] uppercase tracking-widest font-mono mb-1">ECOLOGY / 生態と被害</h3>
              <p className="text-zinc-300 leading-relaxed text-xs">{selectedBug.description}</p>
            </div>

            <div className="border-t border-zinc-850 pt-3">
              <h3 className="font-black text-zinc-500 text-[9px] uppercase tracking-widest font-mono mb-1">DEFENSIVE REGION / 潜みやすい区画</h3>
              <p className="text-cyan-300 font-semibold leading-relaxed text-xs">{selectedBug.hidingSpot}</p>
            </div>

            <div className="border-t border-zinc-850 pt-3">
              <h3 className="font-black text-zinc-500 text-[9px] uppercase tracking-widest font-mono mb-1.5">DEFENSIVE ARSENAL / 有効な兵装（グッズ）</h3>
              <div className="flex flex-wrap gap-2">
                {selectedBug.goods.map((g, idx) => (
                  <span key={idx} className="bg-zinc-950 border border-zinc-850 text-zinc-300 px-3 py-1.5 rounded-xl font-semibold text-[10px] flex items-center gap-1.5 shadow-sm font-mono">
                    <TrapIcon id={getTrapIdFromText(g)} size={18} />
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* プロのコツ */}
            <div className="border-t border-zinc-850 pt-3 mt-auto bg-cyan-950/30 -mx-5 -mb-5 p-5 rounded-b-2xl border-t-cyan-900/40">
              <h3 className="font-black text-cyan-400 text-[10px] uppercase tracking-wider font-mono mb-1">
                SYSTEM RECOMMENDATION / 設置のプロのコツ
              </h3>
              <p className="text-cyan-200/90 leading-relaxed text-[11px] font-medium font-sans">{selectedBug.tips}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}