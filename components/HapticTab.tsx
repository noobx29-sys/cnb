import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue 
} from 'react-native-reanimated';
import { Platform, View } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: Platform.OS === 'ios' ? [{ scale: scale.value }] : []
  }));

  if (Platform.OS === 'android') {
    return (
      <View>
        <PlatformPressable
          {...props}
          android_ripple={{ 
            color: 'rgba(0, 0, 0, 0.1)',
            borderless: false,
            foreground: true
          }}
        >
          {props.children}
        </PlatformPressable>
      </View>
    );
  }

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        scale.value = withSpring(0.95);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPressIn?.(ev);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      <Animated.View style={animatedStyle}>
        {props.children}
      </Animated.View>
    </PlatformPressable>
  );
}