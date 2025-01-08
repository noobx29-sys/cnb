import { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  Dimensions, 
  View, 
  useColorScheme, 
  Platform, 
  StatusBar,
  Modal,
  TouchableOpacity,
  Share,
  Pressable,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Product, updateProduct, uploadImage } from '@/services/firebase';
import { Colors } from '@/constants/Colors';
import { GestureHandlerRootView, PinchGestureHandler, State, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { usePermissions } from '@/hooks/usePermissions';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getDocs } from 'firebase/firestore';
import { productsCollection } from '@/services/firebase';
import { CachedImage } from '@/components/CachedImage';
import { isDesktop, getCarouselWidth } from '@/utils/responsive';

const { width, height } = Dimensions.get('window');

const PRODUCTS_CACHE_KEY = 'products_cache';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export async function getAllProducts() {
  try {
    // Try to fetch from network first
    const querySnapshot = await getDocs(productsCollection);
    const products = querySnapshot.docs.map(doc => doc.data() as Product);
    
    // Cache the products locally
    await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: products
    }));
    
    return products;
  } catch (error) {
    // If network request fails, try to get cached data
    const cachedData = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_EXPIRY_TIME) {
        return data;
      }
    }
    
    // If no cache or expired cache, throw error
    throw error;
  }
}

export function NetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={{ 
      backgroundColor: '#f44336',
      padding: 8,
      alignItems: 'center'
    }}>
      <Text style={{ color: 'white' }}>
        No Internet Connection - Showing Cached Data
      </Text>
    </View>
  );
}

export default function ProductViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { canManageProducts } = usePermissions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: (_event, context) => {
      (context as { startScale: number }).startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = (context as { startScale: number }).startScale * event.scale;
      // Limit the min and max scale
      scale.value = Math.min(Math.max(newScale, 0.5), 3);
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
      }
    },
  });

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    safeArea: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    image: {
      width: isDesktop() ? getCarouselWidth() : width,
      height: isDesktop() ? getCarouselWidth() : width,
      alignSelf: 'center',
    },
    pagination: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 16,
      alignSelf: 'center',
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: 4,
    },
    paginationDotActive: {
      backgroundColor: '#FB8A13',
    },
    content: {
      padding: 16,
      gap: 12,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    price: {
      fontSize: 20,
      color: '#FB8A13',
      fontWeight: 'bold',
    },
    category: {
      fontSize: 16,
      color: '#666',
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
    },
    stock: {
      fontSize: 16,
      color: '#666',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: insets.top + 10,
      right: 20,
      zIndex: 1,
      padding: 10,
    },
    shareButton: {
      position: 'absolute',
      top: insets.top + 10,
      right: 20,
      zIndex: 1,
      padding: 10,
    },
    fullScreenImage: {
      maxWidth: '100%',
      maxHeight: '90%',
      width: width,
      height: undefined,
      aspectRatio: 1,
      resizeMode: 'contain',
    },
    modalPagination: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
    },
    zoomableImage: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    navigationButton: {
      position: 'absolute',
      top: '50%',
      transform: [{ translateY: -25 }],
      padding: 20,
      zIndex: 1,
    },
    leftButton: {
      left: 10,
    },
    rightButton: {
      right: 10,
    },
    fab: {
      position: 'absolute',
      alignSelf: 'center',
      bottom: 50,
      backgroundColor: '#FB8A13',
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    fabIcon: {
      color: '#FFFFFF',
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 16,
    },
    gridImageContainer: {
      width: (width - 48) / 3, // 3 images per row with 16px padding and 8px gap
      aspectRatio: 1,
    },
    gridImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    activeGridImage: {
      borderWidth: 2,
      borderColor: '#FB8A13',
    },
  });

  const handleShare = async () => {
    try {
      if (product?.name && product?.price !== undefined) {
        await Share.share({
          message: `Check out ${product.name} for RM${product.price.toFixed(2)} at https://www.cnbcarpets.com. If you have any questions, feel free to ask at wa.link/mji2vd`,
        });
      } else {
        console.error('Product name or price is undefined');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      const products = await getAllProducts();
      const foundProduct = products.find((p: Product) => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      }
    };
    loadProduct();
  }, [id]);

  const openModal = (index: number) => {
    // Reset scale values when opening modal
    scale.value = 1;
    savedScale.value = 1;
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    scale.value = 1;
    savedScale.value = 1;
    setModalVisible(false);
  };

  const handleAddImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 15,
        quality: 1,
      });

      if (!result.canceled && product) {
        const currentImages = product.images || [];
        if (currentImages.length + result.assets.length > 15) {
          Alert.alert('Error', 'Maximum 15 images allowed');
          return;
        }

        const uploadPromises = result.assets.map(async (image) => {
          try {
            const imageUrl = await uploadImage(image.uri);
            return imageUrl;
          } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
          }
        });

        try {
          const newImageUrls = await Promise.all(uploadPromises);
          const updatedProduct = {
            ...product,
            images: [...currentImages, ...newImageUrls]
          };
          
          await updateProduct(product.id, updatedProduct);
          setProduct(updatedProduct);
          Alert.alert('Success', 'Images added successfully');
        } catch (error: any) {
          Alert.alert('Error', 'Failed to upload images');
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const carouselRef = useRef<ScrollView>(null);

  const handleGridImagePress = (index: number) => {
    setActiveImageIndex(index);
    // Scroll carousel to the selected image
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ x: index * width, animated: true });
    }
    // Scroll main ScrollView to top
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView ref={scrollViewRef}>
            {/* Image Carousel */}
            <View>
              <TouchableOpacity onPress={() => handleShare()} style={styles.shareButton}>
                <Ionicons name="share-outline" size={24} color="#FB8A13" />
              </TouchableOpacity>
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const slide = Math.round(
                    event.nativeEvent.contentOffset.x / width
                  );
                  setActiveImageIndex(slide);
                }}
                scrollEventThrottle={16}
              >
                {product?.images?.map((image, index) => (
                  <TouchableOpacity key={index} onPress={() => openModal(index)}>
                    <CachedImage
                      uri={image}
                      style={styles.image}
                      placeholder={
                        <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                          <ThemedText>Loading...</ThemedText>
                        </View>
                      }
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Pagination Dots */}
              {product?.images && product.images.length > 1 && (
                <View style={styles.pagination}>
                  {product.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === activeImageIndex && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <ThemedView style={styles.content}>
              <ThemedText type="title" style={styles.name}>
                {product.name}
              </ThemedText>
              <ThemedText style={styles.description}>
                {product.description}
              </ThemedText>
              <ThemedText style={styles.price}>
                RM{product.price.toFixed(2)}
              </ThemedText>
              {/* <ThemedText style={styles.stock}>
                Stock: {product.stock}
              </ThemedText> */}
              {product.category && (
                <ThemedText style={styles.category}>
                  Category: {product.category}
                </ThemedText>
              )}

              {/* Add Image Grid */}
              <View style={styles.imageGrid}>
                {product?.images?.map((image, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.gridImageContainer}
                    onPress={() => handleGridImagePress(index)}
                  >
                    <CachedImage
                      uri={image}
                      style={[
                        styles.gridImage,
                        activeImageIndex === index && styles.activeGridImage
                      ]}
                      placeholder={
                        <View style={[styles.gridImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                          <ActivityIndicator size="small" color="#FB8A13" />
                        </View>
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedView>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>

      {/* Full Screen Modal */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeModal}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.View style={styles.zoomableImage}>
              <CachedImage
                uri={product?.images?.[selectedImageIndex] || ''}
                style={[styles.fullScreenImage, animatedImageStyle]}
                resizeMode="contain"
                placeholder={
                  <View style={[styles.fullScreenImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#FB8A13" />
                  </View>
                }
              />
            </Animated.View>
          </PinchGestureHandler>

          {/* Add swipe navigation buttons */}
          {selectedImageIndex > 0 && (
            <TouchableOpacity
              style={[styles.navigationButton, styles.leftButton]}
              onPress={() => setSelectedImageIndex(prev => prev - 1)}
            >
              <Ionicons name="chevron-back" size={30} color="white" />
            </TouchableOpacity>
          )}
          
          {product?.images && selectedImageIndex < product.images.length - 1 && (
            <TouchableOpacity
              style={[styles.navigationButton, styles.rightButton]}
              onPress={() => setSelectedImageIndex(prev => prev + 1)}
            >
              <Ionicons name="chevron-forward" size={30} color="white" />
            </TouchableOpacity>
          )}

          {/* Pagination dots */}
          {product?.images && product.images.length > 1 && (
            <View style={styles.modalPagination}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === selectedImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>

      {canManageProducts() && (
        <Pressable
          style={[styles.fab, styles.fab]}
          onPress={handleAddImages}
        >
          <Ionicons name="add" size={32} style={styles.fabIcon} />
        </Pressable>
      )}
    </GestureHandlerRootView>
  );
}
