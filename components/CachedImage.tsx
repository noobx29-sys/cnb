import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, Platform, StyleSheet, ImageProps } from 'react-native';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  style: any;
  placeholder?: React.ReactNode;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  fadeDuration?: number;
}

export function CachedImage({ 
  uri, 
  style, 
  placeholder, 
  resizeMode = 'contain',
  onLoad,
  fadeDuration,
  ...rest
}: CachedImageProps) {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cacheImage = async () => {
      if (!uri) {
        setLoading(false);
        return;
      }

      try {
        // Generate a safe cache key from the URI
        const cacheKey = uri.split('/').pop()?.replace(/[^a-zA-Z0-9_.-]/g, '_') || 
                        `image_${Date.now()}`;
        
        // Define cache directory path with platform-specific adjustments
        const cacheDir = `${FileSystem.cacheDirectory}images/`;
        const cachePath = `${cacheDir}${cacheKey}`;

        // Check if image is already cached
        const info = await FileSystem.getInfoAsync(cachePath);
        if (info.exists) {
          setImagePath(`file://${cachePath}`);
          setLoading(false);
          return;
        }

        // Check if the cache directory exists
        const dirInfo = await FileSystem.getInfoAsync(cacheDir);
        
        // Create cache directory if it doesn't exist
        if (!dirInfo.exists) {
          console.log('Creating cache directory:', cacheDir);
          await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
          
          // Double-check directory was created (especially important for Android)
          const checkDirInfo = await FileSystem.getInfoAsync(cacheDir);
          if (!checkDirInfo.exists) {
            throw new Error(`Failed to create directory: ${cacheDir}`);
          }
        }

        // Download and cache the image
        if (isOnline) {
          try {
            const downloadOptions = Platform.OS === 'android' 
              ? { cache: true, md5: false } // Optimize for Android
              : undefined;
            
            const { uri: downloadUri } = await FileSystem.downloadAsync(uri, cachePath, downloadOptions);
            
            // Verify the downloaded file exists
            const downloadedInfo = await FileSystem.getInfoAsync(cachePath);
            if (downloadedInfo.exists && downloadedInfo.size > 0) {
              setImagePath(downloadUri);
            } else {
              // If file is empty or doesn't exist, use original URI
              console.warn('Downloaded file is invalid, using original URI');
              setImagePath(uri);
            }
          } catch (downloadError) {
            console.warn('Download failed, using original URI:', downloadError);
            setImagePath(uri);
          }
        } else {
          // If offline, use the original URI
          setImagePath(uri);
        }
      } catch (error) {
        console.error('Error caching image:', error);
        setError(error as Error);
        // Fall back to original URI on error
        setImagePath(uri);
      } finally {
        setLoading(false);
      }
    };

    // Reset state when URI changes
    setLoading(true);
    setImageLoaded(false);
    setError(null);
    cacheImage();
  }, [uri, isOnline]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Call the onLoad callback if provided
    if (onLoad) {
      onLoad();
    }
  };

  const handleError = () => {
    console.warn(`Failed to load image from ${imagePath || uri}, falling back to original URI`);
    // If cached image fails, fall back to original URI
    if (imagePath !== uri && uri) {
      setImagePath(uri);
    }
    setError(new Error('Image loading failed'));
  };

  if (loading) {
    return placeholder || (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FB8A13" />
      </View>
    );
  }

  // Determine the actual fade duration to use
  const actualFadeDuration = Platform.OS === 'android' 
    ? (fadeDuration !== undefined ? fadeDuration : 0) // Default to 0 on Android for better performance
    : (fadeDuration !== undefined ? fadeDuration : 250); // Default to 250 on iOS for smooth transitions
    
  // Use original URI as fallback if caching failed
  return (
    <Image
      style={style}
      source={{ uri: imagePath || uri }}
      resizeMode={resizeMode}
      onLoad={handleImageLoad}
      onError={handleError}
      fadeDuration={actualFadeDuration}
      // Add Android-specific optimizations
      {...(Platform.OS === 'android' && {
        progressiveRenderingEnabled: true, // Enable progressive rendering
        shouldNotifyLoadEvents: true, // Ensure load events are triggered
      })}
      {...rest} // Pass through any additional props
    />
  );
} 