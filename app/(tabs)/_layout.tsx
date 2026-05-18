import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { loadPendingAchievements } from '../../src/stores/alarm-store';

export default function TabLayout() {
  const [hasBadge, setHasBadge] = useState(false);

  // タブが表示されるたびに未読実績をチェック
  useFocusEffect(
    useCallback(() => {
      const check = async () => {
        const pending = await loadPendingAchievements();
        setHasBadge(pending.length > 0);
      };
      check();
      // 定期チェック（アラーム画面から戻ってきた直後に反映するため）
      const timer = setInterval(check, 2000);
      return () => clearInterval(timer);
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.deepSea,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'アクティビティ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '記録',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="trophy-outline" size={size} color={color} />
              {hasBadge && <View style={styles.badge} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
});
