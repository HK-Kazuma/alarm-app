import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../src/constants/theme';
import { Alarm, loadAlarms, saveAlarms } from '../src/stores/alarm-store';
import ScrollPicker from '../src/components/ScrollPicker';

const HOURS = Array.from({ length: 24 }, (_, i) => i);   // 0-23
const MINUTES = Array.from({ length: 60 }, (_, i) => i);  // 0-59

export default function SetAlarmScreen() {
  const router = useRouter();
  // 編集モード: パラメータでアラームデータを受け取る
  const params = useLocalSearchParams<{
    id?: string;
    hour?: string;
    minute?: string;
    label?: string;
    daysOfWeek?: string; // JSON文字列
  }>();
  const isEdit = !!params.id;

  const [hour, setHour] = useState(params.hour ? Number(params.hour) : 7);
  const [minute, setMinute] = useState(params.minute ? Number(params.minute) : 0);
  const [label, setLabel] = useState(params.label || '');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    params.daysOfWeek ? JSON.parse(params.daysOfWeek) : []
  );

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    const alarms = await loadAlarms();

    if (isEdit) {
      // 既存アラームを更新
      const updated = alarms.map((a) =>
        a.id === params.id
          ? { ...a, hour, minute, label, daysOfWeek: selectedDays }
          : a
      );
      await saveAlarms(updated);
    } else {
      // 新規追加
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        hour,
        minute,
        enabled: true,
        label,
        daysOfWeek: selectedDays,
      };
      alarms.push(newAlarm);
      await saveAlarms(alarms);
    }
    router.back();
  };

  return (
    <LinearGradient
      colors={[Colors.nightSky, Colors.deepSea, '#050D1A']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'アラーム編集' : 'アラーム設定'}</Text>
          <TouchableOpacity onPress={handleSave} hitSlop={12}>
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* 時刻ピッカー */}
          <View style={styles.pickerArea}>
            <Text style={styles.pickerLabel}>⏰ 起床時刻</Text>
            <View style={styles.pickerRow}>
              <ScrollPicker
                values={HOURS}
                selected={hour}
                onSelect={setHour}
              />
              <Text style={styles.pickerColon}>:</Text>
              <ScrollPicker
                values={MINUTES}
                selected={minute}
                onSelect={setMinute}
              />
            </View>
          </View>

          {/* 曜日選択 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>繰り返し</Text>
            <View style={styles.daysRow}>
              {dayLabels.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(index) && styles.dayButtonActive,
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDays.includes(index) && styles.dayTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.daysHint}>
              {selectedDays.length === 0
                ? '1回だけ鳴ります'
                : selectedDays.length === 7
                ? '毎日'
                : selectedDays.map((d) => dayLabels[d]).join('・') + 'に繰り返し'}
            </Text>
          </View>

          {/* ラベル */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ラベル</Text>
            <TextInput
              style={styles.textInput}
              value={label}
              onChangeText={setLabel}
              placeholder="例: 朝の航海準備"
              placeholderTextColor={Colors.textMuted}
              maxLength={30}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gold,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pickerArea: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  pickerLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerColon: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.moonlight,
    borderColor: Colors.moonlight,
  },
  dayText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  dayTextActive: {
    color: Colors.deepSea,
    fontWeight: '700',
  },
  daysHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
