import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { ActivityLog, loadActivityLogs } from '../../src/stores/alarm-store';

export default function ActivityScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadActivityLogs().then(setLogs);
    }, [])
  );

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const getTypeColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'wake_up': return Colors.moonlight;
      case 'oversleep': return Colors.coral;
      case 'achievement': return Colors.gold;
    }
  };

  const getTypeLabel = (type: ActivityLog['type']) => {
    switch (type) {
      case 'wake_up': return '起床';
      case 'oversleep': return '寝坊';
      case 'achievement': return '実績';
    }
  };

  return (
    <LinearGradient
      colors={[Colors.nightSky, Colors.deepSea, '#050D1A']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 アクティビティ</Text>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌊</Text>
            <Text style={styles.emptyTitle}>まだログがありません</Text>
            <Text style={styles.emptySubtitle}>
              アラームを使って起床すると{'\n'}ここにログが表示されます
            </Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.logCard}>
                <Text style={styles.logIcon}>{item.icon}</Text>
                <View style={styles.logInfo}>
                  <View style={styles.logTopRow}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '30' }]}>
                      <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
                        {getTypeLabel(item.type)}
                      </Text>
                    </View>
                    <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
                  </View>
                  <Text style={styles.logMessage}>{item.message}</Text>
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  logIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  logInfo: {
    flex: 1,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  logTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  logMessage: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
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
