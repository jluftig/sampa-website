import { type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'outline';

export function AuthButton({
  label,
  onPress,
  icon: Icon,
  variant = 'outline',
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const fg = isPrimary ? '#FFFFFF' : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary
          ? { backgroundColor: theme.tint }
          : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border },
        { opacity: pressed || disabled || loading ? 0.7 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon color={fg} size={20} strokeWidth={2.25} /> : null}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { fontFamily: Fonts.semibold, fontSize: 16 },
});
