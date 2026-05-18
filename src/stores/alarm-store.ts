import AsyncStorage from '@react-native-async-storage/async-storage';

export type Alarm = {
  id: string;
  hour: number;       // 0-23
  minute: number;     // 0-59
  enabled: boolean;
  label: string;
  daysOfWeek: number[]; // 0=日, 1=月, ... 6=土（空=毎日）
};

export type ClockStyle = 'analog' | 'digital' | 'nautical';

export type WakeUpRecord = {
  date: string;           // YYYY-MM-DD
  alarmTime: string;      // HH:mm（設定した時刻）
  wakeUpTime: string;     // HH:mm:ss（実際に起きた時刻）
  secondsToStop: number;  // アラームが鳴ってから止めるまでの秒数
  overslept: boolean;     // 寝坊したか（5分以内に止められなかった）
  onTime: boolean;        // 時刻通りに起きたか
};

// アクティビティログ
export type ActivityLog = {
  id: string;
  timestamp: string;      // ISO文字列
  type: 'wake_up' | 'oversleep' | 'achievement';
  message: string;
  icon: string;
};

// 実績（トロフィー）
export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;      // 解除条件の説明
  threshold: number;      // 解除に必要な数値
  unlockedAt: string | null; // 解除日時（nullなら未解除）
};

// 初期実績リスト
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_wake', name: '初めての航海', description: '初めてアラームを止めた', icon: '⚓', condition: 'onTimeCount', threshold: 1, unlockedAt: null },
  { id: 'wake_5', name: '見習い水兵', description: '時間通りに5回起床', icon: '🔱', condition: 'onTimeCount', threshold: 5, unlockedAt: null },
  { id: 'wake_10', name: '一等航海士', description: '時間通りに10回起床', icon: '🧭', condition: 'onTimeCount', threshold: 10, unlockedAt: null },
  { id: 'wake_30', name: '船長', description: '時間通りに30回起床', icon: '👨‍✈️', condition: 'onTimeCount', threshold: 30, unlockedAt: null },
  { id: 'wake_100', name: '提督', description: '時間通りに100回起床', icon: '🏴‍☠️', condition: 'onTimeCount', threshold: 100, unlockedAt: null },
  { id: 'fast_3', name: '電光石火', description: '10秒以内にアラーム停止を3回', icon: '⚡', condition: 'fastStopCount', threshold: 3, unlockedAt: null },
  { id: 'streak_7', name: '一週間の航路', description: '7日連続で時間通りに起床', icon: '🌟', condition: 'streakDays', threshold: 7, unlockedAt: null },
  { id: 'streak_30', name: '大航海者', description: '30日連続で時間通りに起床', icon: '👑', condition: 'streakDays', threshold: 30, unlockedAt: null },
  { id: 'total_50', name: '歴戦の航海者', description: '累計50回アラームを止めた', icon: '🛡️', condition: 'totalCount', threshold: 50, unlockedAt: null },
];

const ALARMS_KEY = 'alarms';
const CLOCK_STYLE_KEY = 'clockStyle';
const RECORDS_KEY = 'wakeUpRecords';
const ACTIVITY_KEY = 'activityLogs';
const ACHIEVEMENTS_KEY = 'achievements';
const PENDING_ACHIEVEMENTS_KEY = 'pendingAchievements'; // 未表示の解除実績

// ─── アラーム ───
export async function loadAlarms(): Promise<Alarm[]> {
  const json = await AsyncStorage.getItem(ALARMS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
}

// ─── 時計スタイル ───
export async function loadClockStyle(): Promise<ClockStyle> {
  const style = await AsyncStorage.getItem(CLOCK_STYLE_KEY);
  return (style as ClockStyle) || 'digital';
}

export async function saveClockStyle(style: ClockStyle): Promise<void> {
  await AsyncStorage.setItem(CLOCK_STYLE_KEY, style);
}

// ─── 起床記録 ───
export async function loadRecords(): Promise<WakeUpRecord[]> {
  const json = await AsyncStorage.getItem(RECORDS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function addRecord(record: WakeUpRecord): Promise<void> {
  const records = await loadRecords();
  records.push(record);
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// ─── アクティビティログ ───
export async function loadActivityLogs(): Promise<ActivityLog[]> {
  const json = await AsyncStorage.getItem(ACTIVITY_KEY);
  return json ? JSON.parse(json) : [];
}

export async function addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
  const logs = await loadActivityLogs();
  logs.unshift({
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  });
  // 最新100件のみ保持
  if (logs.length > 100) logs.length = 100;
  await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(logs));
}

// ─── 実績 ───
export async function loadAchievements(): Promise<Achievement[]> {
  const json = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
  if (json) return JSON.parse(json);
  // 初回は初期リストを保存
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ACHIEVEMENTS));
  return [...ACHIEVEMENTS];
}

export async function checkAndUnlockAchievements(records: WakeUpRecord[]): Promise<Achievement[]> {
  const achievements = await loadAchievements();
  const newlyUnlocked: Achievement[] = [];
  const now = new Date().toISOString();

  // 各種カウントを計算
  const onTimeCount = records.filter((r) => r.onTime && !r.overslept).length;
  const totalCount = records.length;
  const fastStopCount = records.filter((r) => r.secondsToStop <= 10 && !r.overslept).length;

  // 連続起床日数を計算
  const streakDays = calcStreak(records);

  const stats: Record<string, number> = {
    onTimeCount,
    totalCount,
    fastStopCount,
    streakDays,
  };

  for (const achievement of achievements) {
    if (achievement.unlockedAt) continue; // 既に解除済み
    const value = stats[achievement.condition] || 0;
    if (value >= achievement.threshold) {
      achievement.unlockedAt = now;
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    // 未表示リストに追加（バッジ＆ポップアップ用）
    const pending = await loadPendingAchievements();
    await AsyncStorage.setItem(
      PENDING_ACHIEVEMENTS_KEY,
      JSON.stringify([...pending, ...newlyUnlocked])
    );
    // 実績解除ログを追加
    for (const a of newlyUnlocked) {
      await addActivityLog({
        type: 'achievement',
        message: `実績「${a.name}」を解除しました！`,
        icon: a.icon,
      });
    }
  }

  return newlyUnlocked;
}

// ─── リセット（テスト用） ───
export async function resetRecords(): Promise<void> {
  await AsyncStorage.removeItem(RECORDS_KEY);
  await AsyncStorage.removeItem(ACTIVITY_KEY);
}

export async function resetAchievements(): Promise<void> {
  await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
  await AsyncStorage.removeItem(PENDING_ACHIEVEMENTS_KEY);
}

// ─── 未表示の解除実績（バッジ＆ポップアップ用） ───
export async function loadPendingAchievements(): Promise<Achievement[]> {
  const json = await AsyncStorage.getItem(PENDING_ACHIEVEMENTS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function clearPendingAchievements(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_ACHIEVEMENTS_KEY);
}

function calcStreak(records: WakeUpRecord[]): number {
  if (records.length === 0) return 0;

  // 日付ごとに成功したかを集計
  const successDates = new Set(
    records.filter((r) => r.onTime && !r.overslept).map((r) => r.date)
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (successDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
