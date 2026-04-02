import { Linking, Platform } from 'react-native';
import { apiClient } from '@/lib/axios';
import { getAppInfo } from '@/lib/appInfo';

export interface VersionCheckResult {
  platform: string;
  currentVersion: string;
  currentVersionCode: number;
  runtimeVersion: string;
  latestVersion: string;
  latestVersionCode: number;
  minimumSupportedVersion: string;
  minimumSupportedVersionCode: number;
  updateAvailable: boolean;
  forceUpdate: boolean;
  updateType: string;
  apkUrl: string;
  releaseNotes: string;
  publishedAtUtc?: string;
}

interface VersionCheckApiResponse {
  success: boolean;
  message: string;
  exceptionMessage?: string;
  data?: VersionCheckResult;
}

export async function fetchVersionCheck(): Promise<VersionCheckResult | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  const appInfo = getAppInfo();
  const response = await apiClient.get<VersionCheckApiResponse>('/api/mobile/version-check', {
    params: {
      platform: Platform.OS,
      appVersion: appInfo.version,
      versionCode: appInfo.versionCode,
      runtimeVersion: appInfo.runtimeVersion,
    },
  });

  return response.data.data ?? null;
}

export async function fetchLatestReleaseInfo(): Promise<VersionCheckResult | null> {
  return fetchVersionCheck();
}

export async function openAndroidApkUrl(apkUrl: string): Promise<void> {
  if (!apkUrl) {
    throw new Error('APK URL is empty.');
  }

  await Linking.openURL(apkUrl);
}
