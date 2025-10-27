import React, { useState } from 'react';
import { Image, ImageContentFit } from 'expo-image';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface OptimizedImageProps {
  uri: string;
  style: any;
  resizeMode?: ImageContentFit;
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
      <Image
        source={{ uri }}
        style={style}
        contentFit={resizeMode}
        onLoad={handleLoad}
        cachePolicy="memory-disk"
        {...rest}
      />
    </View>
  );
}

// Preload multiple images
OptimizedImage.preload = (uris: string[]) => {
  // expo-image handles preloading automatically through its caching system
  // You can manually preload by creating Image components with display: none if needed
  console.log('Preloading images:', uris);
};

const styles = StyleSheet.create({
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  }
}); 