// Professional-profile editor — the app twin of the website Dashboard's
// onboarding form (src/pages/Dashboard.jsx PROFILE_FIELDS). Same columns, same
// rules: sms_opt_in requires a phone number, first save stamps onboarded_at.
// RLS allows self-editing these fields; membership/role columns stay
// webhook/admin-only (guard_profile_role).

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { US_STATES } from 'sampa-shared/usStates';

import { AuthButton } from '@/components/auth-button';
import { SelectField } from '@/components/select-field';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

type FormState = {
  full_name: string;
  credentials: string;
  npi: string;
  organization: string;
  practice_setting: string;
  state: string;
  phone: string;
  newsletter_opt_in: boolean;
  sms_opt_in: boolean;
};

const TEXT_FIELDS: {
  key: keyof Omit<FormState, 'newsletter_opt_in' | 'sms_opt_in' | 'state'>;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
}[] = [
  { key: 'full_name', label: 'Full name', placeholder: 'Jane Doe, PA-C' },
  { key: 'credentials', label: 'Credentials', placeholder: 'PA-C, CAQ-Psychiatry' },
  { key: 'npi', label: 'NPI number', placeholder: '10 digits (optional)', keyboardType: 'number-pad' },
  { key: 'organization', label: 'Organization / employer', placeholder: 'Where you practice' },
  {
    key: 'practice_setting',
    label: 'Practice setting',
    placeholder: 'e.g. OTP, FQHC, hospital, private practice',
  },
  { key: 'phone', label: 'Mobile phone', placeholder: 'For text updates (optional)', keyboardType: 'phone-pad' },
];

export default function ProfileEditScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [form, setForm] = useState<FormState | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'needsPhone' | 'error'>('idle');

  useEffect(() => {
    if (profile && form === null) {
      setForm({
        full_name: profile.full_name || '',
        credentials: profile.credentials || '',
        npi: profile.npi || '',
        organization: profile.organization || '',
        practice_setting: profile.practice_setting || '',
        state: profile.state || '',
        phone: profile.phone || '',
        newsletter_opt_in: profile.newsletter_opt_in ?? true,
        sms_opt_in: profile.sms_opt_in ?? false,
      });
    }
  }, [profile, form]);

  if (!user || !form) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.muted, { color: theme.textSecondary }]}>
          {user ? 'Loading your profile…' : 'Sign in on the Account tab to edit your profile.'}
        </Text>
      </View>
    );
  }

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    if (saveState !== 'idle') setSaveState('idle');
  };

  const save = async () => {
    if (form.sms_opt_in && !form.phone.trim()) {
      setSaveState('needsPhone');
      return;
    }
    setSaveState('saving');
    const { error } = await supabase
      .from('profiles')
      .update({
        ...form,
        onboarded_at: profile?.onboarded_at || new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      setSaveState('error');
      return;
    }
    await refreshProfile();
    setSaveState('saved');
    setTimeout(() => router.back(), 600); // brief "Saved ✓" beat, then return
  };

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          Your professional details help SAMPA understand its membership. They're only visible to
          SAMPA administrators — never public.
        </Text>

        {TEXT_FIELDS.slice(0, 5).map((f) => (
          <View key={f.key} style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{f.label}</Text>
            <TextInput
              value={form[f.key]}
              onChangeText={(v) => set(f.key, v)}
              placeholder={f.placeholder}
              placeholderTextColor={theme.textSecondary}
              keyboardType={f.keyboardType || 'default'}
              autoCapitalize={f.key === 'full_name' || f.key === 'organization' ? 'words' : 'none'}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
              ]}
            />
          </View>
        ))}

        <SelectField
          label="State"
          value={form.state}
          options={US_STATES}
          placeholder="Choose your state…"
          onChange={(v) => set('state', v)}
        />

        {TEXT_FIELDS.slice(5).map((f) => (
          <View key={f.key} style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{f.label}</Text>
            <TextInput
              value={form[f.key]}
              onChangeText={(v) => set(f.key, v)}
              placeholder={f.placeholder}
              placeholderTextColor={theme.textSecondary}
              keyboardType={f.keyboardType || 'default'}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
              ]}
            />
          </View>
        ))}

        <View style={[styles.switchRow, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Email newsletter</Text>
          <Switch
            value={form.newsletter_opt_in}
            onValueChange={(v) => set('newsletter_opt_in', v)}
            trackColor={{ true: theme.tint, false: theme.border }}
          />
        </View>
        <View style={[styles.switchRow, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Text-message updates</Text>
          <Switch
            value={form.sms_opt_in}
            onValueChange={(v) => set('sms_opt_in', v)}
            trackColor={{ true: theme.tint, false: theme.border }}
          />
        </View>

        {saveState === 'needsPhone' ? (
          <Text style={[styles.error, { color: theme.accent }]}>
            Add a mobile phone number to receive text updates.
          </Text>
        ) : saveState === 'error' ? (
          <Text style={[styles.error, { color: theme.accent }]}>
            Couldn't save — check your connection and try again.
          </Text>
        ) : null}

        <AuthButton
          label={saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save profile'}
          variant="primary"
          onPress={save}
          loading={saveState === 'saving'}
          disabled={saveState === 'saved'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  muted: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center' },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  intro: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  fieldWrap: { gap: 6 },
  label: { fontFamily: Fonts.medium, fontSize: 13 },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.sans,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 52,
  },
  switchLabel: { fontFamily: Fonts.medium, fontSize: 15 },
  error: { fontFamily: Fonts.medium, fontSize: 14 },
});
