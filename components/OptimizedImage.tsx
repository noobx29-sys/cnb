import React, { useState } from 'react';
import FastImage from 'react-native-fast-image';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface OptimizedImageProps {
  uri: string;
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  priority?: 'low' | 'normal' | 'high';
}

export function OptimizedImage({
  uri,
  style,
  resizeMode = 'cover',
  placeholder,
  onLoad,
  priority = 'normal',
  ...rest
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

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

  // Convert priority string to FastImage constants
  const fastImagePriority = {
    'low': FastImage.priority.low,
    'normal': FastImage.priority.normal,
    'high': FastImage.priority.high,
  }[priority];

  // Generate a downsized thumbnail URL for faster initial loading (if using Firebase Storage)
  const getThumbnailUrl = (url: string) => {
    // Check if it's a Firebase Storage URL
    if (url.includes('firebasestorage.googleapis.com')) {
      // Add _256x256 or appropriate size parameter based on your implementation
      // This is just a placeholder - actual implementation depends on your storage setup
      return url;
    }
    return url;
  };

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  return (
    <View style={style}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.placeholderContainer]}>
          <ActivityIndicator size="small" color="#FB8A13" />
        </View>
      )}
      <FastImage
        source={{ 
          uri,
          priority: fastImagePriority,
          cache: FastImage.cacheControl.immutable
        }}
        style={style}
        resizeMode={fastImageResizeMode}
        onLoad={handleLoad}
        onLoadEnd={handleLoad}
        {...rest}
      />
    </View>
  );
}

// Preload multiple images
OptimizedImage.preload = (uris: string[]) => {
  const sources = uris.map(uri => ({
    uri,
    priority: FastImage.priority.high,
  }));
  
  FastImage.preload(sources);
};

const styles = StyleSheet.create({
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  }
}); 