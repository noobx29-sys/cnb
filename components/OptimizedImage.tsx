import React, { useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Image, ImageResizeMode } from 'react-native';
import { Colors } from '@/constants/Colors';

interface OptimizedImageProps {
  uri: string;
  style: any;
  resizeMode?: ImageResizeMode;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  priority?: 'low' | 'normal' | 'high'; // Note: priority is not used in standard Image component
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
  const [hasError, setHasError] = useState(false);

  if (!uri) {
    return placeholder || (
      <View style={[style, styles.placeholderContainer]}>
        <ActivityIndicator size="large" color="#FB8A13" />
      </View>
    );
  }

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return placeholder || (
      <View style={[style, styles.placeholderContainer]}>
        <ActivityIndicator size="large" color="#FB8A13" />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...rest}
      />
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="small" color="#FB8A13" />
        </View>
      )}
    </View>
  );
}

// Preload multiple images (simplified version without FastImage)
OptimizedImage.preload = (uris: string[]) => {
  // Standard Image component doesn't have preload functionality
  // This is a placeholder for API compatibility
  console.log('Image preload requested for:', uris.length, 'images');
};

const styles = StyleSheet.create({
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  }
}); 