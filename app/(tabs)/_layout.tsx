import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { AppHeader } from '@/components/navigation/AppHeader';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabsLayout(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AppHeader />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
