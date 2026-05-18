import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <>
      {/* ステータスバーを白文字にする（暗い背景用） */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false, // デフォルトのヘッダーを隠す（独自UIを使う）
          contentStyle: { backgroundColor: Colors.deepSea },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
