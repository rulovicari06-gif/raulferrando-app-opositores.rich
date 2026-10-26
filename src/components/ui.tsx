import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Contenedor de pantalla con scroll, márgenes seguros y ancho máximo en ordenador. */
export function Screen({ children, tabs = false }: { children: ReactNode; tabs?: boolean }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.screen,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + (tabs ? BottomTabInset : 0) + Spacing.six },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : null,
        style,
      ]}>
      {children}
    </View>
  );
}

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  /** Color del texto, para botones sobre fondos de color. */
  textColor?: string;
};

export function Button({ label, variant = 'primary', style, small, disabled, textColor, ...props }: ButtonProps) {
  const theme = useTheme();
  const background = {
    primary: theme.primary,
    secondary: theme.backgroundSelected,
    danger: theme.danger,
    ghost: 'transparent',
  }[variant];
  const color = variant === 'primary' || variant === 'danger' ? theme.primaryText : variant === 'ghost' ? theme.primary : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}
      {...props}>
      <ThemedText type={small ? 'smallBold' : 'default'} style={{ color: textColor ?? color, fontWeight: '700' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }, style]}
        {...props}
      />
    </View>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected?: boolean; onPress?: () => void; color?: string }) {
  const theme = useTheme();
  const active = color ?? theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? active : theme.border, backgroundColor: selected ? active : theme.backgroundElement },
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? '#fff' : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionText}>
        {children}
      </ThemedText>
      {action}
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, backgroundColor: color ?? theme.primary }]} />
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: Spacing.three, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two, borderWidth: StyleSheet.hairlineWidth },
  button: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two },
  sectionText: { textTransform: 'uppercase', letterSpacing: 0.8 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
});
