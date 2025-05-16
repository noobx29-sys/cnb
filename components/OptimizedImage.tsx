import React from 'react';
import { Image as ExpoImage } from 'expo-image';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface OptimizedImageProps {
  uri: string;
  style: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  transition?: number;
}

export function OptimizedImage({
  uri,
  style,
  contentFit = 'cover',
  placeholder,
  onLoad,
  transition = 300,
  ...rest
}: OptimizedImageProps) {
  if (!uri) {
    return placeholder || (
      <View style={[style, styles.placeholderContainer]}>
        <ActivityIndicator size="large" color="#FB8A13" />
      </View>
    );
  }

  return (
    <ExpoImage
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      cachePolicy="memory-disk"
      placeholder={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }}
      onLoad={onLoad}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  }
}); 