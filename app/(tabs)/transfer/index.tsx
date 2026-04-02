import React from 'react';
import { Redirect } from 'expo-router';

export default function TransferPage(): React.ReactElement {
  return <Redirect href='/(tabs)/flows/transfer/assigned' />;
}
