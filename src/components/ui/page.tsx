import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import {
  SafeAreaView,
  type Edge,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<
  ViewProps & {
    edges?: Edge[];
  }
>;

export function Screen({ children, style, edges = ['top', 'left', 'right'], ...rest }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.screen, { backgroundColor: theme.background }, style]}
      {...rest}>
      {children}
    </SafeAreaView>
  );
}

export function Content({
  children,
  style,
  maxWidth = MaxContentWidth,
  ...rest
}: PropsWithChildren<ViewProps & { maxWidth?: number }>) {
  return (
    <View style={[styles.content, { maxWidth }, style]} {...rest}>
      {children}
    </View>
  );
}

type PageScrollProps = PropsWithChildren<
  ScrollViewProps & {
    bottomTabInset?: boolean;
    maxWidth?: number;
  }
>;

export function PageScroll({
  children,
  contentContainerStyle,
  bottomTabInset = false,
  maxWidth = MaxContentWidth,
  ...rest
}: PageScrollProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom:
            insets.bottom + Spacing.five + (bottomTabInset ? BottomTabInset : 0),
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      {...rest}>
      <View style={[styles.content, { maxWidth }]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
});
