import { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, Pressable, SafeAreaView, Dimensions, FlatList, RefreshControl, ActivityIndicator, ScrollView, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { handleSignOut } from '@/utils/auth';
import { getAllPromotions } from '@/services/firebase';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Promotion types
interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  minimumPurchase: number;
  active: boolean;
  productId: string;
  createdBy: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function HomeScreen() {
  const { userData } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      alignItems: 'center',
    },
    safeArea: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    welcomeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
    },
    carouselContainer: {
      marginVertical: 4,
    },
    carouselItem: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      padding: 8,
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 1,
      position: 'relative',
    },
    promoImage: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
      resizeMode: 'cover',
    },
    titleOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    promoTitle: {
      color: '#FFFFFF',
      fontSize: 24,
    },
    promoDescription: {
      color: '#FFFFFF',
      fontSize: 16,
      opacity: 0.7,
      fontWeight: '400',
    },
    pagination: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 16,
      alignSelf: 'center',
      gap: 8,
      backgroundColor: 'transparent',
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      elevation: 0,
      shadowColor: 'transparent',
    },
    paginationDotActive: {
      backgroundColor: Colors.light.tint,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      backgroundColor: Colors.light.secondaryBackground,
      borderRadius: 16,
      marginHorizontal: 16
    },
    emptyStateText: {
      color: Colors.light.text,
      fontSize: 16,
      opacity: 0.7,
      fontWeight: '400',
    },
    scrollContainer: {
      flex: 1,
    },
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const promos = await getAllPromotions() as Promotion[];
      if (Array.isArray(promos)) {
        const now = new Date();
        
        const activePromos = promos.filter((promo) => {
          // Handle raw Firestore Timestamp object
          const parseTimestamp = (timestamp: any) => {
            if (timestamp?.seconds) {
              return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
            }
            return new Date(timestamp);
          };

          const startDate = parseTimestamp(promo.startDate);
          const endDate = parseTimestamp(promo.endDate);
          
          return (
            promo.active && 
            !isNaN(startDate.getTime()) && 
            !isNaN(endDate.getTime()) && 
            startDate.getTime() <= now.getTime() && 
            endDate.getTime() >= now.getTime()
          );
        });
        
        setPromotions(activePromos);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      setPromotions([]);
    }
  };

  const renderPromotion = ({ item }: { item: Promotion }) => {
    if (!item || !item.images || !item.images.length) {
      return null;
    }

    return (
      <ThemedView style={[styles.carouselItem, { width: screenWidth - 32 }]}>
        {item.images.map((imageUrl, index) => (
          <Pressable 
            key={index}
            onPress={() => router.push(`/product/${item.productId}`)}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.promoImage}
            />
            <ThemedView style={styles.titleOverlay}>
              <ThemedText type="title" style={styles.promoTitle}>{item.name}</ThemedText>
              <ThemedText type="subtitle" style={styles.promoDescription}>{item.description}</ThemedText>
            </ThemedView>
          </Pressable>
        ))}
      </ThemedView>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromotions();
    setRefreshing(false);
  };

  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollContainer}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FB8A13']} // Android
              tintColor="#FB8A13" // iOS
            />
          }
        >
          <ThemedView style={styles.welcomeContainer}>
            <ThemedText type="title">Hello, {userData?.name || 'Guest'}!</ThemedText>
          </ThemedView>

          <ThemedView style={styles.carouselContainer}>
            {promotions.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>No promotions available</ThemedText>
              </ThemedView>
            ) : (
              <>
                <Animated.FlatList
                  ref={flatListRef}
                  data={promotions}
                  renderItem={renderPromotion}
                  horizontal
                  pagingEnabled
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                  showsHorizontalScrollIndicator={false}
                  viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                />
                <ThemedView style={styles.pagination}>
                  {promotions.map((_, index) => (
                    <ThemedView
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === activeIndex && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </ThemedView>
              </>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}