import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PackageHeaderDetailScreen } from '@/features/package-mobile/screens/PackageHeaderDetailScreen';

export default function PackageHeaderDetailRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ headerId?: string | string[] }>();
  const headerIdParam = Array.isArray(params.headerId) ? params.headerId[0] : params.headerId;
  const headerId = Number(headerIdParam ?? 0);

  return <PackageHeaderDetailScreen headerId={Number.isFinite(headerId) ? headerId : 0} />;
}
