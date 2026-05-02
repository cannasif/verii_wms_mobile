import type * as SignalR from '@microsoft/signalr';
import { getApiBaseUrl } from '@/constants/config';
import { showMessage } from '@/lib/feedback';
import { useAuthStore } from '@/store/auth';

type SignalRModule = typeof import('@microsoft/signalr');

type NotificationPayload = {
  id?: number;
  title?: string;
  message?: string;
};

const INITIAL_RETRY_DELAYS_MS = [0, 2000, 5000, 10000] as const;
const RECONNECT_DELAYS_MS = [0, 2000, 10000, 30000] as const;
const SERVER_TIMEOUT_MS = 30000;
const KEEP_ALIVE_INTERVAL_MS = 15000;

let signalRModulePromise: Promise<SignalRModule> | null = null;

async function loadSignalR(): Promise<SignalRModule> {
  signalRModulePromise ??= import('@microsoft/signalr');
  return signalRModulePromise;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class RealtimeNotificationsService {
  private hubConnection: SignalR.HubConnection | null = null;

  private connectPromise: Promise<void> | null = null;

  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private manualDisconnect = false;

  private activeToken: string | null = null;

  async connect(): Promise<void> {
    const signalR = await loadSignalR();
    const token = useAuthStore.getState().token;
    if (!token) {
      await this.disconnect();
      return;
    }

    if (this.activeToken && this.activeToken !== token) {
      await this.disconnect();
    }

    const state = this.hubConnection?.state;
    if (state === signalR.HubConnectionState.Connected
      || state === signalR.HubConnectionState.Connecting
      || state === signalR.HubConnectionState.Reconnecting) {
      return this.connectPromise ?? Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.manualDisconnect = false;
    this.clearReconnectTimeout();
    this.connectPromise = this.startConnection(token).finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    this.activeToken = null;
    this.clearReconnectTimeout();

    const connection = this.hubConnection;
    this.hubConnection = null;
    this.connectPromise = null;

    if (connection) {
      try {
        await connection.stop();
      } catch (error) {
        console.error('[RealtimeNotifications] Failed to stop SignalR connection:', error);
      }
    }
  }

  private async startConnection(token: string): Promise<void> {
    const signalR = await loadSignalR();
    const hubUrl = `${getApiBaseUrl().replace(/\/$/, '')}/notificationHub`;
    const connection = this.createConnection(signalR, hubUrl);

    this.hubConnection = connection;
    this.activeToken = token;

    for (const retryDelayMs of INITIAL_RETRY_DELAYS_MS) {
      if (this.manualDisconnect) {
        return;
      }

      if (retryDelayMs > 0) {
        await delay(retryDelayMs);
      }

      try {
        await connection.start();
        return;
      } catch (error) {
        console.error('[RealtimeNotifications] SignalR connection error:', error);
      }
    }

    this.hubConnection = null;
    this.activeToken = null;
  }

  private createConnection(signalR: SignalRModule, hubUrl: string): SignalR.HubConnection {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => useAuthStore.getState().token ?? '',
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delayMs = RECONNECT_DELAYS_MS[retryContext.previousRetryCount];
          return delayMs ?? RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1];
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.serverTimeoutInMilliseconds = SERVER_TIMEOUT_MS;
    connection.keepAliveIntervalInMilliseconds = KEEP_ALIVE_INTERVAL_MS;

    connection.on('ReceiveNotification', (payload: NotificationPayload) => {
      this.handleNotification(payload);
    });

    connection.onclose((error) => {
      if (error) {
        console.error('[RealtimeNotifications] SignalR connection closed with error:', error);
      }

      this.hubConnection = null;

      if (!this.manualDisconnect && useAuthStore.getState().token) {
        this.scheduleReconnect();
      }
    });

    return connection;
  }

  private handleNotification(payload: NotificationPayload): void {
    const title = payload.title?.trim() || 'Bildirim';
    const message = payload.message?.trim();
    if (!message) {
      return;
    }

    showMessage(title, message);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      void this.connect().catch((error) => {
        console.error('[RealtimeNotifications] Scheduled reconnect failed:', error);
      });
    }, 5000);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

export const realtimeNotifications = new RealtimeNotificationsService();
