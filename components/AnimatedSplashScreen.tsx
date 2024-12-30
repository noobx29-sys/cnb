import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

type Props = {
  onAnimationComplete: (finished: boolean) => void;
  children: React.ReactNode;
};

export function AnimatedSplashScreen({ children, onAnimationComplete }: Props) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const hideSplashScreen = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      console.error('Error hiding splash screen:', e);
    }
  }, []);

  useEffect(() => {
    // Start the animation immediately
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      // Hide the splash screen after the animation starts
      runOnJS(hideSplashScreen)();
      // Notify that the animation is complete
      runOnJS(onAnimationComplete)(finished ?? false);
    });
    scale.value = withTiming(1.05, { duration: 200 });
  }, []);

  return (
    <View style={styles.container}>
      {children}
      <Animated.View 
        style={[StyleSheet.absoluteFill, animatedStyles]} 
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});