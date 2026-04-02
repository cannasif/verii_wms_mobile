import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index(): React.ReactElement {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
