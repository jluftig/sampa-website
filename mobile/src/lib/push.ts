// Push notification plumbing (Expo Push).
//
// Flow: an opted-in, signed-in member grants iOS notification permission →
// we fetch this device's Expo push token → upsert into `device_tokens` (RLS:
// own rows). When the website publishes a post, a Supabase Database Webhook
// calls api/send-push.js, which fans out to every token whose profile has
// push_opt_in = true. Opting out flips profiles.push_opt_in — tokens stay,
// sends stop (the server filters).
//
// Simulator-safe: every entry point no-ops off real devices.

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabaseClient';

// Foreground behavior: show banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId;
}

/** True if the OS has already granted notification permission. */
export async function hasPushPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Ask for permission (if needed), fetch this device's Expo push token, and
 * upsert it for the signed-in user. Returns true when a token is registered.
 */
export async function registerForPush(userId: string): Promise<boolean> {
  if (!Device.isDevice) return false; // simulators can't receive push

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return false;

  const id = projectId();
  if (!id) return false;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
  if (!token) return false;

  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS === 'android' ? 'android' : 'ios',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' }
  );
  return !error;
}

/**
 * Silent token refresh on sign-in: only when permission is ALREADY granted
 * (never prompts), so an opted-in member's token stays current per device.
 */
export async function refreshPushToken(userId: string): Promise<void> {
  if (await hasPushPermission()) {
    await registerForPush(userId).catch(() => {});
  }
}
