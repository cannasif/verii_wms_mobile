import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';

export default function AuthLayout(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
