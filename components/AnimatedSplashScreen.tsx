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

  const hideAsync = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    hideAsync();
    
    opacity.value = withTiming(0, { duration: 1000 }, (finished) => {
      runOnJS(onAnimationComplete)(finished ?? false);
    });
    scale.value = withTiming(1.1, { duration: 1000 });
  }, []);

  return (
    <View style={styles.container}>
      {children}
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyles]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});