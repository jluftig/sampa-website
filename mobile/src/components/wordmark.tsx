import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** SAMPA wordmark: Playfair "SAMPA" with a teal accent dot. */
export function Wordmark({ size = 22 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.word, { color: theme.text, fontSize: size }]}>SAMPA</Text>
      <View style={[styles.dot, { backgroundColor: theme.tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  word: { fontFamily: Fonts.serifBold, letterSpacing: 0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginBottom: 6 },
});
