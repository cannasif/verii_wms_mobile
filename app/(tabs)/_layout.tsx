import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { AppHeader } from '@/components/navigation/AppHeader';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabsLayout(): React.ReactElement {
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
      <AppHeader />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
