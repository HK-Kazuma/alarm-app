import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize } from '../src/constants/theme';
import { playAlarmSound, stopAlarmSound } from '../src/hooks/useAlarmChecker';
import {
  addRecord,
  addActivityLog,
  loadRecords,
  checkAndUnlockAchievements,
} from '../src/stores/alarm-store';
import { Audio } from 'expo-av';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const ICON_SIZE = 70;
const SAFE_MARGIN = 20;
const TAP_GOAL = 5;
const TIME_LIMIT_SEC = 300; // 5分 = 300秒
const BOTTOM_BAR_HEIGHT = 100; // bottomBar の占有高さ

export default function AlarmRingingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hour: string; minute: string; label: string }>();
  const [tapsLeft, setTapsLeft] = useState(TAP_GOAL);
  const [stopped, setStopped] = useState(false);
  const [overslept, setOverslept] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [topInfoHeight, setTopInfoHeight] = useState(200); // テキスト領域の高さ（初期値は推定値）
  const soundRef = useRef<Audio.Sound | null>(null);
  const startTimeRef = useRef(Date.now());

  // アイコンの位置（Animated）
  const posX = useRef(new Animated.Value(SCREEN_W / 2 - ICON_SIZE / 2)).current;
  const posY = useRef(new Animated.Value(SCREEN_H / 3)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // アラーム音を開始
  useEffect(() => {
    startTimeRef.current = Date.now();
    playAlarmSound().then((sound) => {
      soundRef.current = sound;
    });
    return () => {
      if (soundRef.current) {
        stopAlarmSound(soundRef.current);
      }
    };
  }, []);

  // 経過時間カウンター＆制限時間チェック
  useEffect(() => {
    if (stopped) return;
    const timer = setInterval(() => {
      const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(sec);

      if (sec >= TIME_LIMIT_SEC) {
        // 寝坊判定
        clearInterval(timer);
        handleOversleep();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [stopped]);

  const handleOversleep = async () => {
    setStopped(true);
    setOverslept(true);
    if (soundRef.current) {
      await stopAlarmSound(soundRef.current);
      soundRef.current = null;
    }

    const now = new Date();
    const secondsToStop = TIME_LIMIT_SEC;

    await addRecord({
      date: now.toISOString().split('T')[0],
      alarmTime: `${params.hour?.padStart(2, '0')}:${params.minute?.padStart(2, '0')}`,
      wakeUpTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      secondsToStop,
      overslept: true,
      onTime: false,
    });

    await addActivityLog({
      type: 'oversleep',
      message: `${params.hour?.padStart(2, '0')}:${params.minute?.padStart(2, '0')} のアラームに5分以内に起きられませんでした`,
      icon: '😴',
    });
  };

  // アイコンをランダムな位置に動かす（テキストの下〜ボトムバーの上）
  const moveIcon = () => {
    const minX = SAFE_MARGIN;
    const maxX = SCREEN_W - ICON_SIZE - SAFE_MARGIN;
    const minY = topInfoHeight + SAFE_MARGIN;
    const maxY = SCREEN_H - ICON_SIZE - BOTTOM_BAR_HEIGHT;
    const newX = minX + Math.random() * Math.max(0, maxX - minX);
    const newY = minY + Math.random() * Math.max(0, maxY - minY);

    Animated.parallel([
      Animated.spring(posX, {
        toValue: newX,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.spring(posY, {
        toValue: newY,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();
  };

  // 定期的に動く
  useEffect(() => {
    if (stopped) return;
    const interval = setInterval(moveIcon, 1500);
    moveIcon();
    return () => clearInterval(interval);
  }, [stopped, topInfoHeight]);

  // タップハンドラ
  const handleTap = async () => {
    if (stopped) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const remaining = tapsLeft - 1;
    setTapsLeft(remaining);

    if (remaining <= 0) {
      setStopped(true);
      if (soundRef.current) {
        await stopAlarmSound(soundRef.current);
        soundRef.current = null;
      }

      const now = new Date();
      const secondsToStop = Math.floor((Date.now() - startTimeRef.current) / 1000);

      await addRecord({
        date: now.toISOString().split('T')[0],
        alarmTime: `${params.hour?.padStart(2, '0')}:${params.minute?.padStart(2, '0')}`,
        wakeUpTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
        secondsToStop,
        overslept: false,
        onTime: true,
      });

      await addActivityLog({
        type: 'wake_up',
        message: `${params.hour?.padStart(2, '0')}:${params.minute?.padStart(2, '0')} に起床成功！（${secondsToStop}秒で停止）`,
        icon: '⛵',
      });

      // 実績チェック
      const records = await loadRecords();
      await checkAndUnlockAchievements(records);
    } else {
      moveIcon();
    }
  };

  const formatCountdown = () => {
    const remaining = Math.max(0, TIME_LIMIT_SEC - elapsedSec);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={
        stopped
          ? overslept
            ? ['#28100A', '#1A0A14', '#0A1628']
            : [Colors.nightSky, '#0A2F1A', '#0A1628']
          : ['#1A0A28', '#280A1A', '#0A1628']
      }
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {stopped ? (
          overslept ? (
            // 寝坊画面
            <View style={styles.successArea}>
              <Text style={styles.successIcon}>😴</Text>
              <Text style={[styles.successTitle, { color: Colors.coral }]}>寝坊…！</Text>
              <Text style={styles.successSubtitle}>
                5分以内に起きられませんでした{'\n'}次は頑張りましょう！
              </Text>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: Colors.coral }]}
                onPress={() => router.back()}
              >
                <Text style={styles.doneButtonText}>ホームに戻る</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // 起床成功画面
            <View style={styles.successArea}>
              <Text style={styles.successIcon}>⛵</Text>
              <Text style={styles.successTitle}>おはよう！起床成功！</Text>
              <Text style={styles.successSubtitle}>
                船が無事に出航しました（{Math.floor((Date.now() - startTimeRef.current) / 1000)}秒）
              </Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => router.back()}
              >
                <Text style={styles.doneButtonText}>ホームに戻る</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <>
            <View style={styles.topInfo} onLayout={(e) => setTopInfoHeight(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
              <Text style={styles.alarmLabel}>
                {params.label || '目覚まし'}
              </Text>
              <Text style={styles.alarmTimeDisplay}>
                {params.hour?.padStart(2, '0')}:{params.minute?.padStart(2, '0')}
              </Text>
              <Text style={styles.instruction}>
                船を{tapsLeft}回タップして起床！
              </Text>
              {/* 残り時間 */}
              <Text style={[
                styles.countdown,
                elapsedSec >= TIME_LIMIT_SEC - 60 && { color: Colors.coral },
              ]}>
                残り {formatCountdown()}
              </Text>
            </View>

            {/* タップ対象 */}
            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  transform: [
                    { translateX: posX },
                    { translateY: posY },
                    { scale },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleTap}
                style={styles.iconTouchable}
                activeOpacity={0.7}
              >
                <Text style={styles.shipIcon}>🚢</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* 残りタップ数 */}
            <View style={styles.bottomBar}>
              <View style={styles.progressRow}>
                {Array.from({ length: TAP_GOAL }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      i < TAP_GOAL - tapsLeft && styles.progressDotFilled,
                    ]}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  topInfo: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  alarmLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  alarmTimeDisplay: {
    fontSize: FontSize.clock,
    fontWeight: '200',
    color: Colors.coral,
    letterSpacing: 4,
  },
  instruction: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.gold,
    marginTop: Spacing.md,
  },
  countdown: {
    fontSize: FontSize.lg,
    fontWeight: '300',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  iconWrapper: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconTouchable: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipIcon: { fontSize: 56 },
  bottomBar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  progressDotFilled: {
    backgroundColor: Colors.gold,
  },
  successArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: Colors.moonlight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 30,
  },
  doneButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.deepSea,
  },
});
