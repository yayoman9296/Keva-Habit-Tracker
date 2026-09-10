import { useRef } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBackNavigation } from '@/hooks/useBackNavigation';
import { colors, fonts } from '@/theme';

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 0.4;

type BackNavigationProps = ViewProps & {
  children: React.ReactNode;
};

export default function BackNavigation({ children, style, ...rest }: BackNavigationProps) {
  const insets = useSafeAreaInsets();
  const { shouldShowBack, goBack } = useBackNavigation();
  const goBackRef = useRef(goBack);
  const shouldShowRef = useRef(shouldShowBack);

  goBackRef.current = goBack;
  shouldShowRef.current = shouldShowBack;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (!shouldShowRef.current) return false;
        const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
        return isHorizontal && gesture.dx < -12;
      },
      onPanResponderRelease: (_, gesture) => {
        if (!shouldShowRef.current) return;

        const swipedLeft =
          gesture.dx < -SWIPE_DISTANCE ||
          (gesture.dx < -30 && gesture.vx < -SWIPE_VELOCITY);

        if (swipedLeft) {
          goBackRef.current();
        }
      },
    }),
  ).current;

  return (
    <View
      style={[styles.container, style]}
      {...(shouldShowBack ? panResponder.panHandlers : {})}
      {...rest}
    >
      {shouldShowBack ? (
        <Pressable
          onPress={goBack}
          style={[styles.backButton, { top: insets.top + 8 }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </Pressable>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    width: 44,
    zIndex: 10,
  },
  backArrow: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },
});