import React from 'react';
import FastImage from 'react-native-fast-image';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface OptimizedImageProps {
  uri: string;
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholder?: React.ReactNode;
  onLoad?: () => void;
}

export function OptimizedImage({
  uri,
  style,
  resizeMode = 'cover',
  placeholder,
  onLoad,
  ...rest
}: OptimizedImageProps) {
  if (!uri) {
    return placeholder || (
      <View style={[style, styles.placeholderContainer]}>
        <ActivityIndicator size="large" color="#FB8A13" />
      </View>
    );
  }

  // Convert resizeMode to FastImage constants
  const fastImageResizeMode = {
    'cover': FastImage.resizeMode.cover,
    'contain': FastImage.resizeMode.contain,
    'stretch': FastImage.resizeMode.stretch,
    'center': FastImage.resizeMode.center,
  }[resizeMode];

  return (
    <FastImage
      source={{ 
        uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable
      }}
      style={style}
      resizeMode={fastImageResizeMode}
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