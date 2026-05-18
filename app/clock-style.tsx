import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../src/constants/theme';
import {
  ClockStyle,
  loadClockStyle,
  saveClockStyle,
} from '../src/stores/alarm-store';

type StyleOption = {
  id: ClockStyle;
  name: string;
  icon: string;
  description: string;
  preview: string;
};

const clockOptions: StyleOption[] = [
  {
    id: 'digital',
    name: 'デジタル',
    icon: '🔢',
    description: 'シンプルなデジタル時計',
    preview: '07:00',
  },
  {
    id: 'analog',
    name: 'アナログ',
    icon: '🕐',
    description: '船のクロノメーター風',
    preview: '⏱',
  },
  {
    id: 'nautical',
    name: '航海時計',
    icon: '🧭',
    description: 'コンパス＆波のアニメーション付き',
    preview: '🌊',
  },
];

export default function ClockStyleScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<ClockStyle>('digital');

  useEffect(() => {
    loadClockStyle().then(setSelected);
  }, []);

  const handleSelect = async (style: ClockStyle) => {
    setSelected(style);
    await saveClockStyle(style);
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
            <Ionicons name="arrow-back" size={28} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>時計デザイン</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          {clockOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selected === option.id && styles.optionCardSelected,
              ]}
              onPress={() => handleSelect(option.id)}
            >
              <View style={styles.optionPreview}>
                <Text style={styles.previewText}>{option.preview}</Text>
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View>
                  <Text style={styles.optionName}>{option.name}</Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
              </View>
              {selected === option.id && (
                <View style={styles.checkMark}>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.gold} />
                </View>
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.hint}>
            ※ アナログ・航海時計はPhase 3で実装予定です
          </Text>
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  optionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  optionPreview: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  previewText: {
    fontSize: 40,
    color: Colors.textPrimary,
    fontWeight: '200',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkMark: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
