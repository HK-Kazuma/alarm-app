import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { useClock } from '../../src/hooks/useClock';
import { useAlarmChecker } from '../../src/hooks/useAlarmChecker';
import { Alarm, loadAlarms, saveAlarms } from '../../src/stores/alarm-store';

export default function HomeScreen() {
  const router = useRouter();
  const { timeString, secondsString, dateString } = useClock();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const isNavigatingRef = useRef(false);

  // アラーム時刻チェック — 時刻になったらアラーム画面に遷移
  useAlarmChecker((alarm) => {
    if (isNavigatingRef.current) return; // 多重遷移を防止
    isNavigatingRef.current = true;
    router.push({
      pathname: '/alarm-ringing',
      params: {
        hour: String(alarm.hour),
        minute: String(alarm.minute),
        label: alarm.label,
      },
    });
  });

  // 画面にフォーカスが戻るたびにアラームを再読込＋遷移フラグリセット
  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
      loadAlarms().then(setAlarms);
    }, [])
  );

  const toggleAlarm = async (id: string) => {
    const updated = alarms.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    setAlarms(updated);
    await saveAlarms(updated);
  };

  const deleteAlarm = async (id: string) => {
    const updated = alarms.filter((a) => a.id !== id);
    setAlarms(updated);
    await saveAlarms(updated);
  };

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  const formatDays = (days: number[]) => {
    if (days.length === 0 || days.length === 7) return '毎日';
    return days.map((d) => dayLabels[d]).join(' ');
  };

  const nextAlarm = alarms
    .filter((a) => a.enabled)
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))[0];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <LinearGradient
      colors={[Colors.nightSky, Colors.deepSea, '#050D1A']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>⚓ 目覚まし同盟</Text>
          <TouchableOpacity
            onPress={() => router.push('/clock-style')}
            hitSlop={12}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 時計エリア */}
        <View style={styles.clockArea}>
          <Text style={styles.dateText}>{dateString}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{timeString}</Text>
            <Text style={styles.secondsText}>{secondsString}</Text>
          </View>
          {nextAlarm && (
            <View style={styles.nextAlarmBadge}>
              <Ionicons name="alarm-outline" size={16} color={Colors.gold} />
              <Text style={styles.nextAlarmText}>
                次のアラーム {String(nextAlarm.hour).padStart(2, '0')}:
                {String(nextAlarm.minute).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>

        {/* 波の装飾ライン */}
        <View style={styles.waveDivider}>
          <Text style={styles.waveText}>〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜</Text>
        </View>

        {/* アラームリスト */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>アラーム一覧</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/set-alarm')}
          >
            <Ionicons name="add" size={24} color={Colors.deepSea} />
          </TouchableOpacity>
        </View>

        {alarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚢</Text>
            <Text style={styles.emptyTitle}>まだアラームがありません</Text>
            <Text style={styles.emptySubtitle}>
              + ボタンからアラームを追加して{'\n'}航海の準備をしましょう
            </Text>
          </View>
        ) : (
          <FlatList
            data={alarms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={() => (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteAlarm(item.id)}
                  >
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                    <Text style={styles.deleteText}>削除</Text>
                  </TouchableOpacity>
                )}
                overshootRight={false}
              >
                <TouchableOpacity
                  style={[styles.alarmCard, !item.enabled && styles.alarmCardDisabled]}
                  onPress={() =>
                    router.push({
                      pathname: '/set-alarm',
                      params: {
                        id: item.id,
                        hour: String(item.hour),
                        minute: String(item.minute),
                        label: item.label,
                        daysOfWeek: JSON.stringify(item.daysOfWeek),
                      },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.alarmInfo}>
                    <Text
                      style={[
                        styles.alarmTime,
                        !item.enabled && styles.alarmTimeDisabled,
                      ]}
                    >
                      {String(item.hour).padStart(2, '0')}:
                      {String(item.minute).padStart(2, '0')}
                    </Text>
                    <Text style={styles.alarmLabel}>
                      {item.label || '目覚まし'}　{formatDays(item.daysOfWeek)}
                    </Text>
                  </View>
                  <Switch
                    value={item.enabled}
                    onValueChange={() => toggleAlarm(item.id)}
                    trackColor={{ false: Colors.textMuted, true: Colors.moonlight }}
                    thumbColor={item.enabled ? Colors.gold : Colors.textSecondary}
                  />
                </TouchableOpacity>
              </Swipeable>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  appTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gold,
  },
  clockArea: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: FontSize.clock,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  secondsText: {
    fontSize: FontSize.xl,
    fontWeight: '300',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  nextAlarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  nextAlarmText: {
    color: Colors.gold,
    fontSize: FontSize.sm,
  },
  waveDivider: {
    alignItems: 'center',
    overflow: 'hidden',
    height: 20,
  },
  waveText: {
    color: Colors.wave,
    fontSize: FontSize.md,
    opacity: 0.4,
    letterSpacing: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  alarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alarmCardDisabled: {
    opacity: 0.5,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: FontSize.xxl,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  alarmTimeDisabled: {
    color: Colors.textMuted,
  },
  alarmLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  deleteButton: {
    backgroundColor: Colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  deleteText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
