import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isValidKey } from '@/lib/dates';

/** Selector numérico con botones − y +. */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 100,
  format = (v: number) => String(v),
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  const theme = useTheme();
  const round = (v: number) => Math.round(v * 100) / 100;
  return (
    <View style={styles.stepper}>
      <ThemedText style={styles.stepperLabel}>{label}</ThemedText>
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={`Menos ${label}`}
          onPress={() => onChange(Math.max(min, round(value - step)))}
          style={[styles.round, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">−</ThemedText>
        </Pressable>
        <ThemedText type="smallBold" style={styles.value}>
          {format(value)}
        </ThemedText>
        <Pressable
          accessibilityLabel={`Más ${label}`}
          onPress={() => onChange(Math.min(max, round(value + step)))}
          style={[styles.round, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

/** Convierte "DD/MM/AAAA" en "AAAA-MM-DD". Devuelve undefined si no es una fecha válida. */
export function parseSpanishDate(text: string): string | undefined {
  const m = text.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!m) return undefined;
  const key = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return isValidKey(key) ? key : undefined;
}

export function toSpanishDate(key?: string): string {
  if (!key) return '';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

export function isValidTime(text: string) {
  const m = text.match(/^(\d{1,2}):(\d{2})$/);
  return Boolean(m && Number(m[1]) < 24 && Number(m[2]) < 60);
}

export function normalizeTime(text: string) {
  const [h, m] = text.split(':');
  return `${h.padStart(2, '0')}:${m}`;
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  stepperLabel: { flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 64, textAlign: 'center' },
});
