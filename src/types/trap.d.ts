export interface Room {
  id: string;
  name: string;      // 例: "キッチン", "北側の寝室"
  type: string;      // アイコン等の分岐用（kitchen, living, bath, etc...）
  x: number;         // グリッド上のX座標（％またはマス目）
  y: number;         // グリッド上のY座標
  w: number;         // 横幅のサイズ
  h: number;         // 縦幅のサイズ
}

export interface ExtendedRoom extends Room {
  floor: number;
}

export interface Trap {
  id: string;
  userId: string | null; // ゲスト時はnull、アカウント登録後はUIDが入る
  name: string;          // グッズ名（例: ゴキブリホイホイ）
  placedLocation: string; // 補足メモ（例: 冷蔵庫の裏の隙間）
  roomId: string;        // どの部屋に配置されているか（Room.idと紐付け）
  x: number;             // 部屋の中での相対X座標 (0.0〜1.0)
  y: number;             // 部屋の中での相対Y座標 (0.0〜1.0)
  placedDate: string;    // ISO文字列（例: 2026-05-25）
  expirationDate: string;// 有効期限のISO文字列
  isActive: boolean;     // 設置中か回収済みか
}