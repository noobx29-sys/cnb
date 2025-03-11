import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

interface CachedImageProps {
  uri: string;
  style: any;
  placeholder?: React.ReactNode;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'repeat' | 'center';
}

export function CachedImage({ uri, style, placeholder, resizeMode = 'contain' }: CachedImageProps) {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
  }, []);

  useEffect(() => {
    const cacheImage = async () => {
      try {
        const cacheKey = uri.split('/').pop();
        const cachePath = `${FileSystem.cacheDirectory}images/${cacheKey}`;

        // Check if image is already cached
        const info = await FileSystem.getInfoAsync(cachePath);
        if (info.exists) {
          setImagePath(`file://${cachePath}`);
          setLoading(false);
          return;
        }

        // Create cache directory if it doesn't exist
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.cacheDirectory}images/`,
          { intermediates: true }
        );

        // Download and cache the image
        if (isOnline) {
          const { uri: downloadUri } = await FileSystem.downloadAsync(
            uri,
            cachePath
          );
          setImagePath(downloadUri);
        }
      } catch (error) {
        console.error('Error caching image:', error);
      } finally {
        setLoading(false);
      }
    };

    cacheImage();
  }, [uri, isOnline]);

  if (loading) {
    return placeholder || (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FB8A13" />
      </View>
    );
  }

  return (
    <Image
      style={style}
      source={{ uri: imagePath || uri }}
      resizeMode={resizeMode}
    />
  );
} 