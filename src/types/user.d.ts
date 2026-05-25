export interface AppUser {
  uid: string;
  isAnonymous: boolean;   // ゲストユーザーかどうか
  fcmTokens: string[];    // プッシュ通知を送る端末のトークン配列
  region: string | null;  // 天気・虫予報用の地域（例: "和歌山県"）
  createdAt: string;
}