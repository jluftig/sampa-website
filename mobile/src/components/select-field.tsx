import { Check, ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * A form select rendered as a tappable field that opens a full-screen modal
 * list. Pure RN (no native picker dependency — deliberate on this new SDK).
 */
export function SelectField({
  label,
  value,
  options,
  placeholder = 'Choose…',
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
        ]}>
        <Text
          style={[styles.value, { color: value ? theme.text : theme.textSecondary }]}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown color={theme.textSecondary} size={18} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <X color={theme.textSecondary} size={22} />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? theme.tint : theme.text },
                      selected && { fontFamily: Fonts.semibold },
                    ]}>
                    {item}
                  </Text>
                  {selected ? <Check color={theme.tint} size={18} /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: Fonts.medium, fontSize: 13 },
  field: {
    height: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  value: { fontFamily: Fonts.sans, fontSize: 16, flex: 1 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  modalTitle: { fontFamily: Fonts.serifBold, fontSize: 22 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  optionText: { fontFamily: Fonts.sans, fontSize: 16, flex: 1 },
});
