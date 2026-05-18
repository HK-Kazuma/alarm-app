import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import {
  WakeUpRecord,
  Achievement,
  loadRecords,
  loadAchievements,
  resetRecords,
  resetAchievements,
  loadPendingAchievements,
  clearPendingAchievements,
} from '../../src/stores/alarm-store';

export default function RecordsScreen() {
  const [records, setRecords] = useState<WakeUpRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  // ポップアップ用
  const [pendingPopups, setPendingPopups] = useState<Achievement[]>([]);
  const [currentPopup, setCurrentPopup] = useState<Achievement | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRecords().then(setRecords);
      loadAchievements().then(setAchievements);
      // 未表示の実績があればポップアップを表示
      loadPendingAchievements().then((pending) => {
        if (pending.length > 0) {
          setPendingPopups(pending);
          setCurrentPopup(pending[0]);
        }
      });
    }, [])
  );

  // ポップアップを1つずつ消していく
  const dismissPopup = async () => {
    const remaining = pendingPopups.slice(1);
    if (remaining.length > 0) {
      setPendingPopups(remaining);
      setCurrentPopup(remaining[0]);
    } else {
      setPendingPopups([]);
      setCurrentPopup(null);
      await clearPendingAchievements();
    }
  };

  const handleResetRecords = () => {
    Alert.alert('記録をリセット', '起床記録とアクティビティログを全て削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: async () => {
          await resetRecords();
          setRecords([]);
        },
      },
    ]);
  };

  const handleResetAchievements = () => {
    Alert.alert('実績をリセット', '全ての実績を未解除に戻しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: async () => {
          await resetAchievements();
          const fresh = await loadAchievements();
          setAchievements(fresh);
        },
      },
    ]);
  };

  // 統計を計算
  const totalAlarms = records.length;
  const onTimeCount = records.filter((r) => r.onTime && !r.overslept).length;
  const oversleptCount = records.filter((r) => r.overslept).length;
  const avgSeconds =
    totalAlarms > 0
      ? Math.round(
          records.reduce((sum, r) => sum + (r.secondsToStop || 0), 0) / totalAlarms
        )
      : 0;
  const successRate = totalAlarms > 0 ? Math.round((onTimeCount / totalAlarms) * 100) : 0;

  const formatAvgTime = (sec: number) => {
    if (sec < 60) return `${sec}秒`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}分${s}秒`;
  };

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <LinearGradient
      colors={[Colors.nightSky, Colors.deepSea, '#050D1A']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 記録ヘッダー + リセットボタン */}
          <View style={styles.header}>
            <Text style={styles.title}>📊 記録</Text>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetRecords}>
              <Ionicons name="refresh" size={14} color={Colors.coral} />
              <Text style={styles.resetText}>リセット</Text>
            </TouchableOpacity>
          </View>

          {/* 統計カード */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{onTimeCount}</Text>
              <Text style={styles.statLabel}>時間通り起床</Text>
              <Text style={styles.statIcon}>⏰</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{successRate}%</Text>
              <Text style={styles.statLabel}>起床成功率</Text>
              <Text style={styles.statIcon}>📈</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatAvgTime(avgSeconds)}</Text>
              <Text style={styles.statLabel}>平均停止時間</Text>
              <Text style={styles.statIcon}>⚡</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, oversleptCount > 0 && { color: Colors.coral }]}>
                {oversleptCount}
              </Text>
              <Text style={styles.statLabel}>寝坊した回数</Text>
              <Text style={styles.statIcon}>😴</Text>
            </View>
          </View>

          {/* 実績ヘッダー + リセットボタン */}
          <View style={styles.achievementHeader}>
            <View style={styles.achievementHeaderLeft}>
              <Text style={styles.sectionTitle}>🏆 実績</Text>
              <Text style={styles.achievementCount}>
                {unlockedCount} / {achievements.length}
              </Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetAchievements}>
              <Ionicons name="refresh" size={14} color={Colors.coral} />
              <Text style={styles.resetText}>リセット</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.achievementGrid}>
            {achievements.map((achievement) => {
              const unlocked = !!achievement.unlockedAt;
              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !unlocked && styles.achievementCardLocked,
                  ]}
                >
                  <Text style={[styles.achievementIcon, !unlocked && styles.lockedIcon]}>
                    {unlocked ? achievement.icon : '🔒'}
                  </Text>
                  <Text style={[styles.achievementName, !unlocked && styles.lockedText]}>
                    {achievement.name}
                  </Text>
                  <Text style={[styles.achievementDesc, !unlocked && styles.lockedText]}>
                    {achievement.description}
                  </Text>
                  {unlocked && (
                    <Text style={styles.unlockedDate}>
                      {new Date(achievement.unlockedAt!).toLocaleDateString('ja-JP')}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* 実績解除ポップアップ */}
        <Modal
          visible={currentPopup !== null}
          transparent
          animationType="fade"
          onRequestClose={dismissPopup}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={dismissPopup}
          >
            <View style={styles.popupCard}>
              <Text style={styles.popupLabel}>🎉 実績解除！</Text>
              <Text style={styles.popupIcon}>{currentPopup?.icon}</Text>
              <Text style={styles.popupName}>{currentPopup?.name}</Text>
              <Text style={styles.popupDesc}>{currentPopup?.description}</Text>
              <Text style={styles.popupHint}>タップして閉じる</Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  resetText: {
    fontSize: FontSize.xs,
    color: Colors.coral,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  achievementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  achievementCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  achievementCard: {
    width: '47%',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    alignItems: 'center',
  },
  achievementCardLocked: {
    borderColor: Colors.border,
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  lockedIcon: {
    fontSize: 28,
  },
  achievementName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  lockedText: {
    color: Colors.textMuted,
  },
  unlockedDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  // ポップアップ
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupCard: {
    backgroundColor: Colors.ocean,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  popupLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: Spacing.md,
  },
  popupIcon: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  popupName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  popupDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  popupHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
