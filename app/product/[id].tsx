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
  FlatList,
  Animated,
  Easing,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Product, updateProduct, uploadImage } from '@/services/firebase';
import { Colors } from '@/constants/Colors';
import { GestureHandlerRootView, PinchGestureHandler, State, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import ReAnimated, {
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
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '@/services/firebase';
import { User } from '@/services/firebase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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

const generateProductPDF = async (product: Product, canSeePrice: boolean) => {
  try {
    // Function to create image grid HTML
    const generateImageGrid = (images: string[]) => {
      return `
        <div class="image-grid">
          ${images.map(image => `
            <div class="image-item">
              <img src="${image}" class="grid-image" />
            </div>
          `).join('')}
        </div>
      `;
    };

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              padding-bottom: 20px;
            }
            .product-name { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 10px;
              color: #333;
            }
            .product-details { 
              margin-top: 20px;
              padding: 0 20px;
            }
            .description { 
              margin: 15px 0; 
              line-height: 1.6;
              color: #444;
              white-space: pre-wrap;
              text-align: justify;
            }
            .category { 
              color: #666; 
              margin-top: 10px;
              font-style: italic;
            }
            .image-grid {
              display: flex;
              flex-direction: column;
              gap: 20px;
              margin-top: 30px;
            }
            .image-item {
              width: 100%;
            }
            .grid-image {
              width: 100%;
              height: auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="product-name">${product.name}</div>
          </div>

          <div class="product-details">
            <div class="description">${product.description.replace(/\n/g, '<br>')}</div>
            ${product.category ? `<div class="category">Category: ${product.category}</div>` : ''}
          </div>

          ${product.images && product.images.length > 0 ? `
            ${generateImageGrid(product.images)}
          ` : ''}
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });
    
    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default function ProductViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentModalImage, setCurrentModalImage] = useState(0);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { canManageProducts } = usePermissions();
  const { canSeePrice } = usePermissions();
  const router = useRouter();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const [loading, setLoading] = useState<boolean>(true);

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onActive: (event) => {
      scale.value = savedScale.value * event.scale;
    },
    onEnd: () => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    },
  });

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const [isFabOpen, setIsFabOpen] = useState(false);

  // Initialize Animated value for fabMenu
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 for closed, 1 for open

  const scaleAnim = useRef(new Animated.Value(0.8)).current; // For scaling effect

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isFabOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: isFabOpen ? 1 : 0.8,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, [isFabOpen]);

  // Define animated style for fabMenu
  const animatedFabMenuStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0], // Slide up by 20 when opening
        }),
      },
      {
        scale: scaleAnim,
      },
    ],
    opacity: slideAnim, // Fade in/out
  };

  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Get current user and their role
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(productsCollection, firebaseUser.uid));
        setUser(userDoc.data() as User);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const products = await getAllProducts();
        const foundProduct = products.find((p: Product) => p.id === id);
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          Alert.alert('Error', 'Product not found');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load product');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

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
    },
    modalImageContainer: {
      width: width,
      height: height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalImage: {
      maxWidth: width,
      maxHeight: height,
      width: '100%',
      height: undefined,
      aspectRatio: 1,
      resizeMode: 'contain',
    },
    modalHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: insets.top,
      zIndex: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: insets.bottom,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
    },
    imageCounterMain: {
      position: 'absolute',
      bottom: insets.bottom + 15,
      alignSelf: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 8,
      borderRadius: 15,
      zIndex: 1,
    },
    imageCounter: {
      color: 'white',
      fontSize: 16,
    },
    closeButton: {
      position: 'absolute',
      top: insets.top,
      right: 20,
      zIndex: 1,
      padding: 10,
    },
    shareButton: {
      position: 'absolute',
      top: insets.top,
      right: 20,
      zIndex: 1,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 20,
    },
    fullScreenImage: {
      width: '100%',
      height: '100%',
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
      flexDirection: 'column',
      gap: 8,
      marginTop: 16,
      width: '100%',
    },
    gridImageContainer: {
      width: '100%',
      aspectRatio: 1,
      marginBottom: 8,
    },
    gridImage: {
      width: '100%',
      height: '100%',
      borderRadius: 0,
    },
    activeGridImage: {
      // Remove border styles completely
    },
    backButton: {
      position: 'absolute',
      top: insets.top,
      left: 20,
      zIndex: 1,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 20,
    },
    imageCounterText: {
      color: 'white',
      fontSize: 14,
    },
    fabContainer: {
      position: 'absolute',
      bottom: 50,
      right: 48,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    fabMenu: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      padding: 8,
      minWidth: 160,
    },
    fabMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FB8A13',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 24,
      marginBottom: 6,
      width: '100%',
    },
    fabMenuText: {
      color: '#FFFFFF',
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactMessage: {
      fontSize: 16,
      color: '#666',
      marginTop: 16,
    },
  });

  const handleShare = async () => {
    try {
      if (product?.name) {
        setLoading(true);
        
        // Check if sharing is available
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (!isSharingAvailable) {
          Alert.alert('Error', 'Sharing is not available on this device');
          return;
        }

        const pdfUri = await generateProductPDF(product, canSeePrice());
        
        // Share the PDF file
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `${product.name} Details`,
          UTI: 'com.adobe.pdf' // for iOS
        });
      } else {
        console.error('Product name is undefined');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share product details');
    } finally {
      setLoading(false);
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
    openModal(index);
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB8A13" />
          <Text style={{ marginTop: 10 }}>Loading Product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Product not found.</Text>
        </View>
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
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FB8A13" />
              </TouchableOpacity>

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
                {product?.images?.slice(0, 6).map((image, index) => (
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
              {product?.images && product.images.slice(0, 6).length > 1 && (
                <View style={styles.pagination}>
                  {product.images.slice(0, 6).map((_, index) => (
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
              {!canSeePrice() ? (
                <ThemedText style={styles.contactMessage}>
                Please contact us for pricing information
                </ThemedText>
              ) : ( 
                <ThemedText style={styles.price}>
                RM{product.price.toFixed(2)}
              </ThemedText>
              )}
              {/* <ThemedText style={styles.stock}>
                Stock: {product.stock}
              </ThemedText> */}
              {product.category && (
                <ThemedText style={styles.category}>
                  Category: {product.category}
                </ThemedText>
              )}

              {/* Add Image Grid for all images */}
              <View style={styles.imageGrid}>
                <ThemedText style={{ marginBottom: 16, fontSize: 18, fontWeight: 'bold' }}>
                  All Images
                </ThemedText>
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
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={product?.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImageIndex}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ 
                  index: selectedImageIndex, 
                  animated: false 
                });
              }, 100);
            }}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentModalImage(newIndex);
            }}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.modalImageContainer}>
                <PinchGestureHandler onGestureEvent={pinchHandler}>
                  <ReAnimated.View>
                    <CachedImage
                      uri={item}
                      style={[styles.modalImage, animatedImageStyle]}
                      placeholder={
                        <ActivityIndicator size="large" color="#FB8A13" />
                      }
                    />
                  </ReAnimated.View>
                </PinchGestureHandler>
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
          />

          <View style={styles.modalFooter}>
            <Text style={styles.imageCounter}>
              {currentModalImage + 1} / {product?.images?.length}
            </Text>
          </View>
        </View>
      </Modal>

      {canManageProducts() && (
        <View style={styles.fabContainer}>
          {isFabOpen && (
            <Animated.View style={[styles.fabMenu, animatedFabMenuStyle]}>
              <Pressable
                style={styles.fabMenuItem}
                onPress={() => {
                  handleAddImages();
                  setIsFabOpen(false);
                }}
              >
                <Ionicons name="images-outline" size={24} color="#FFFFFF" />
                <Text style={styles.fabMenuText}>Add Images</Text>
              </Pressable>
              <Pressable
                style={styles.fabMenuItem}
                onPress={() => {
                  router.push(`/admin/product/${id}`);
                  setIsFabOpen(false);
                }}
              >
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                <Text style={styles.fabMenuText}>Edit Product</Text>
              </Pressable>
            </Animated.View>
          )}
          <Pressable
            style={styles.fab}
            onPress={() => setIsFabOpen(!isFabOpen)}
          >
            <Ionicons 
              name={isFabOpen ? "close" : "add"} 
              size={32} 
              style={styles.fabIcon} 
            />
          </Pressable>
        </View>
      )}
    </GestureHandlerRootView>
  );
}
