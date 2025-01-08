import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface MapProps {
  style: ViewStyle;
}

export default function Map({ style }: MapProps) {
  return (
    <View style={style}>
      <Text>Maps are not supported on web platform</Text>
    </View>
  );
} 