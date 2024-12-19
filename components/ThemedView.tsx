import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '@/context/ColorSchemeContext';
import { Colors } from '@/constants/Colors';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'primary' | 'secondary';
};

export function ThemedView({ style, lightColor, darkColor, variant = 'primary', ...otherProps }: ThemedViewProps) {
  const { colorScheme } = useColorScheme();
  const backgroundColor = lightColor || darkColor 
    ? colorScheme === 'dark' ? darkColor : lightColor
    : Colors[colorScheme][variant === 'primary' ? 'background' : 'secondaryBackground'];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
