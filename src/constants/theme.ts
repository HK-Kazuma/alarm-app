// 航海テーマのカラーパレット — 夢の中の海をイメージ
export const Colors = {
  // メインカラー
  deepSea: '#0A1628',       // 深海の紺（背景）
  nightSky: '#0F2140',      // 夜空の紺（背景グラデーション）
  ocean: '#1A3A5C',         // 海の青（カード背景）
  wave: '#2E6B9E',          // 波の青
  moonlight: '#4A9BD9',     // 月明かりの青
  starlight: '#7EC8E3',     // 星明かりの水色

  // アクセントカラー
  gold: '#F4C430',          // 金（コンパス・星・重要要素）
  sunset: '#FF8C42',        // 夕焼けオレンジ
  coral: '#FF6B6B',         // 珊瑚レッド（警告・アラーム）

  // テキスト
  textPrimary: '#E8F0FE',   // 白に近い青白
  textSecondary: '#8BADC9', // 薄い青灰色
  textMuted: '#4A6B87',     // 暗い青灰色

  // UI要素
  cardBg: 'rgba(26, 58, 92, 0.6)',  // 半透明カード
  border: 'rgba(78, 155, 217, 0.3)', // 枠線
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 48,
  clock: 72,
} as const;
