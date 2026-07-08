// Optional biometric (Face ID / Touch ID) app lock. This is a UX layer ON TOP of
// the persisted Supabase session — it never replaces auth, it just gates opening
// the app. Preference is stored per-device in AsyncStorage.
//
// Note: biometrics require a development/production build; they do not work in
// Expo Go (see docs/mobile-app-setup.md).

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const PREF_KEY = 'sampa.requireBiometric';

/** Device has biometric hardware AND the user has enrolled a face/fingerprint. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function getBiometricPref(): Promise<boolean> {
  return (await AsyncStorage.getItem(PREF_KEY)) === 'true';
}

export async function setBiometricPref(value: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_KEY, value ? 'true' : 'false');
}

/** Prompt for biometric auth. Returns true on success. */
export async function authenticateBiometric(promptMessage = 'Unlock SAMPA'): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
    });
    return res.success;
  } catch {
    return false;
  }
}

/** Human label for the device's biometric method, e.g. "Face ID". */
export async function getBiometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Touch ID';
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'Iris';
  } catch {
    // fall through
  }
  return 'biometric unlock';
}
