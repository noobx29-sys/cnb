import { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, Pressable, SafeAreaView, Dimensions, FlatList, RefreshControl, ActivityIndicator, ScrollView, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { handleSignOut } from '@/utils/auth';
import { getAllPromotions, getAllProducts, Product } from '@/services/firebase';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermissions } from '@/hooks/usePermissions';
import React from 'react';

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

// Remove the useRef wrapper and define the viewability config outside the component
const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 100,
};

export default function HomeScreen() {
  const { userData } = useAuth();
  const { canManageProducts } = usePermissions();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

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
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    carouselContainer: {
      marginVertical: 4,
      height: 500,
      width: screenWidth,
      alignItems: 'center',
    },
    carouselItem: {
      width: screenWidth,
      height: '100%',
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    imageContainer: {
      width: '100%',
      height: '100%',
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
    lowStockSection: {
      marginTop: 32,
      paddingHorizontal: 16,
      marginBottom: 56,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    lowStockCard: {
      backgroundColor: Colors.light.background, // Adapted for light and dark mode
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: Colors.light.text, // Adapted for light and dark mode
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: Colors.dark.border, // Adapted for light and dark mode
    },
    lowStockContent: {
      flexDirection: 'row',
      padding: 0,
      alignItems: 'center',
    },
    productImage: {
      width: 100,
      height: 100,
      borderRadius: 0,
      backgroundColor: Colors.light.secondaryBackground, // Adapted for light and dark mode
    },
    productDetails: {
      flex: 1,
      marginLeft: 16,
      justifyContent: 'space-between',
      height: 80,
    },
    productName: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    stockWarning: {
      color: Colors.light.error, // Adapted for light and dark mode
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },
    price: {
      fontSize: 16,
      color: Colors.light.tint, // This will be dynamically set based on theme
      fontWeight: '500',
      marginTop: 4,
    },
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const [promos, products] = await Promise.all([
        getAllPromotions() as Promise<Promotion[]>,
        getAllProducts() as Promise<Product[]>
      ]);
      
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

      const lowStock = products.filter(product => product.stock < 10);
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error loading promotions:', error);
      setPromotions([]);
    }
  };

  const renderPromotion = ({ item }: { item: Promotion }) => {
    if (!item || !item.images || !item.images.length) {
      return null;
    }
  
    // Add centering logic for single item
    const isSingleItem = promotions.length === 1;
    
    return (
      <Pressable 
        onPress={() => router.push(`/product/${item.productId}`)}
        style={[
          styles.carouselItem,
          isSingleItem && { width: screenWidth }  // Ensure full width for single item
        ]}
      >
        <ThemedView style={styles.imageContainer}>
          <Image
            source={{ uri: item.images[0] }}
            style={styles.promoImage}
          />
          <ThemedView style={styles.titleOverlay}>
            <ThemedText type="title" style={styles.promoTitle}>{item.name}</ThemedText>
            <ThemedText type="subtitle" style={styles.promoDescription}>{item.description}</ThemedText>
          </ThemedView>
        </ThemedView>
      </Pressable>
    );
  };

  // Define onViewableItemsChanged without useRef
  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  };

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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FB8A13']}
              tintColor="#FB8A13"
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
                  snapToInterval={screenWidth}
                  decelerationRate="fast"
                  viewabilityConfig={viewabilityConfig}
                  onViewableItemsChanged={onViewableItemsChanged}
                  contentContainerStyle={promotions.length === 1 ? { flex: 1 } : undefined}
                  scrollEnabled={promotions.length > 1}
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

          {/* {canManageProducts() && (
            <ThemedView style={styles.lowStockSection}>
              <ThemedText style={styles.sectionTitle}>Running out soon</ThemedText>
              {lowStockProducts.length === 0 ? (
                <ThemedText>No products are low in stock</ThemedText>
              ) : (
                lowStockProducts.map(product => (
                  <Pressable
                    key={product.id}
                    style={styles.lowStockCard}
                    onPress={() => router.push(`/product/${product.id}`)}
                  >
                    <ThemedView style={styles.lowStockContent}>
                      {product.images && product.images[0] && (
                        <Image
                          source={{ uri: product.images[0] }}
                          style={styles.productImage}
                        />
                      )}
                      <ThemedView style={styles.productDetails}>
                        <ThemedView>
                          <ThemedText style={styles.productName}>{product.name}</ThemedText>
                          <ThemedText style={styles.stockWarning}>
                            Only {product.stock} left in stock
                          </ThemedText>
                        </ThemedView>
                        <ThemedText style={styles.price}>
                          RM{product.price.toFixed(2)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </Pressable>
                ))
              )}
            </ThemedView>
          )} */}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}