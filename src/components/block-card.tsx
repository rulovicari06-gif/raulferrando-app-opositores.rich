import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { KindColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BlockKind, DayBlock } from '@/lib/types';

export const KIND_LABEL: Record<BlockKind, string> = {
  teoria: 'Teoría',
  psicotecnicos: 'Psicotécnicos',
  fisico: 'Físico',
};

export function BlockCard({ block, done, interactive = true }: { block: DayBlock; done?: boolean; interactive?: boolean }) {
  const theme = useTheme();
  const color = KindColors[block.kind];
  return (
    <Pressable
      disabled={!interactive}
      onPress={() => router.push({ pathname: '/bloque/[id]', params: { id: block.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : done ? 0.6 : 1 },
      ]}>
      <View style={styles.time}>
        <ThemedText type="smallBold">{block.start}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {block.minutes}′
        </ThemedText>
      </View>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={styles.body}>
        <ThemedText type="small" style={{ color, fontWeight: '700' }}>
          {KIND_LABEL[block.kind].toUpperCase()} · {block.method}
        </ThemedText>
        <ThemedText type="default" style={done ? styles.doneText : undefined} numberOfLines={2}>
          {block.title}
        </ThemedText>
      </View>
      <View style={[styles.check, { borderColor: done ? theme.success : theme.border, backgroundColor: done ? theme.success : 'transparent' }]}>
        {done ? <ThemedText style={styles.tick}>✓</ThemedText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  time: { width: 48, alignItems: 'center' },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  body: { flex: 1, gap: 2 },
  doneText: { textDecorationLine: 'line-through' },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#fff', fontWeight: '800', fontSize: 14, lineHeight: 18 },
});
