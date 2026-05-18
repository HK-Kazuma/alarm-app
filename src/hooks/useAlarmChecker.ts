import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Alarm, loadAlarms } from '../stores/alarm-store';

type AlarmCallback = (alarm: Alarm) => void;

/**
 * 毎秒アラーム時刻をチェックし、一致したら callback を呼ぶフック。
 * Expo Go で動作するフォアグラウンド専用の仕組み。
 */
export function useAlarmChecker(onAlarmFired: AlarmCallback) {
  const firedRef = useRef<Set<string>>(new Set());
  const lastDateRef = useRef<string>('');
  // コールバックをrefに保存して、タイマーのリセットを防ぐ
  const callbackRef = useRef(onAlarmFired);
  callbackRef.current = onAlarmFired;

  useEffect(() => {
    const check = async () => {
      const now = new Date();
      const today = now.toDateString();
      if (lastDateRef.current !== today) {
        firedRef.current.clear();
        lastDateRef.current = today;
      }

      // 秒が0のときだけチェック（17:00:00に1回だけ発火させる）
      if (now.getSeconds() !== 0) return;

      const alarms = await loadAlarms();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay();

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        if (firedRef.current.has(alarm.id)) continue;

        if (
          alarm.daysOfWeek.length > 0 &&
          !alarm.daysOfWeek.includes(currentDay)
        ) {
          continue;
        }

        if (alarm.hour === currentHour && alarm.minute === currentMinute) {
          firedRef.current.add(alarm.id);
          callbackRef.current(alarm);
          break;
        }
      }
    };

    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, []); // 依存配列を空にしてタイマーを1回だけ設定
}

// アラーム音を鳴らす（ループ再生）
export async function playAlarmSound(): Promise<Audio.Sound> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true, // iOSのサイレントモードでも鳴る
    staysActiveInBackground: false,
  });

  const { sound } = await Audio.Sound.createAsync(
    require('../../assets/alarm-sound.wav'),
    { isLooping: true, volume: 1.0 }
  );
  await sound.playAsync();
  return sound;
}

export async function stopAlarmSound(sound: Audio.Sound) {
  await sound.stopAsync();
  await sound.unloadAsync();
}
