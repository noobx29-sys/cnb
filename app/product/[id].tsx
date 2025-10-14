import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
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
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Product, updateProduct, uploadImage, Category, getAllCategories, getAllProducts, getProductById } from '@/services/database';
import { Colors } from '@/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePermissions } from '@/hooks/usePermissions';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OptimizedImage } from '@/components/OptimizedImage';
import { isDesktop, getCarouselWidth } from '@/utils/responsive';
import { getCurrentUser } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';

const { width, height } = Dimensions.get('window');

const PRODUCTS_CACHE_KEY = 'products_cache';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentModalImage, setCurrentModalImage] = useState(0);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { canManageProducts } = usePermissions();
  const { canSeePrice } = usePermissions();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Define styles first to avoid "used before declaration" linter errors
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
      height: isDesktop() ? getCarouselWidth() * 0.75 : width * 0.75,
      alignSelf: 'center',
      resizeMode: 'contain',
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
      paddingHorizontal: 0,
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
    description: {
      fontSize: 16,
      lineHeight: 24,
    },
    contactMessage: {
      fontSize: 16,
      color: '#666',
      marginTop: 16,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalHeader: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 20,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      zIndex: 10,
    },
    modalImageContainer: {
      width: width,
      height: height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paginationDots: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 50 : 30,
      alignSelf: 'center',
    },
    imageCounter: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    shareButton: {
      position: 'absolute',
      top: 16,
      right: 16,
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
    backButton: {
      position: 'absolute',
      top: 16,
      left: 16,
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
    imageGrid: {
      flexDirection: 'column',
      marginTop: 16,
      width: '100%',
      paddingHorizontal: 0,
    },
    gridImageContainer: {
      width: '100%',
      height: undefined,
      aspectRatio: 1,
      marginBottom: 4,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    gridImage: {
      width: '100%',
      height: undefined,
      aspectRatio: 1,
      borderRadius: 0,
      resizeMode: 'contain',
    },
    activeGridImage: {
      // Remove border styles
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryContainer: {
      marginVertical: 4,
      marginHorizontal: 10,
      flexDirection: 'column',
      alignItems: 'flex-start',
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(251, 138, 19, 0.05)',
      padding: 10,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#FB8A13',
    },
    categoryLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    categoryPath: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingHorizontal: 5,
    },
    categoryItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryItem: {
      fontSize: 16,
      color: '#FB8A13',
      marginHorizontal: 2,
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
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const carouselRef = useRef<ScrollView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

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
  }, [isFabOpen, slideAnim, scaleAnim]);

  const animatedFabMenuStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
      {
        scale: scaleAnim,
      },
    ],
    opacity: slideAnim,
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    loadCategories();
  }, []);

  const loadProduct = async () => {
    try {
      // Try to get specific product first, fallback to getting all products
      let foundProduct: Product | null = null;
      
      try {
        foundProduct = await getProductById(id);
      } catch (error) {
        console.log('Fallback to getting all products');
        const products = await getAllProducts();
        foundProduct = products.find((p: Product) => p.id === id) || null;
      }
      
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProduct();
  }, [id]);

  const getCategoryNameById = (categoryId: string | null): string => {
    if (!categoryId) return '';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };
  
  const getSubcategoryNameById = (categoryId: string | null, subcategoryId: string | null): string => {
    if (!categoryId || !subcategoryId) return '';
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || !category.subCategories) {
      return subcategoryId;
    }
    const subcategory = category.subCategories.find((sub: any) => sub.id === subcategoryId);
    return subcategory ? subcategory.name : subcategoryId;
  };
  
  const getSubsubcategoryNameById = (categoryId: string | null, subcategoryId: string | null, subsubcategoryId: string | null): string => {
    if (!categoryId || !subcategoryId || !subsubcategoryId) return '';
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || !category.subCategories) {
      return subsubcategoryId;
    }
    const subcategory = category.subCategories.find((sub: any) => sub.id === subcategoryId);
    if (!subcategory || !subcategory.subCategories) {
      return subsubcategoryId;
    }
    const subsubcategory = subcategory.subCategories.find((subsub: any) => subsub.id === subsubcategoryId);
    return subsubcategory ? subsubcategory.name : subsubcategoryId;
  };

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setCurrentModalImage(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleGridImagePress = (index: number) => {
    openModal(index);
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
            const imageUrl = await uploadImage(image.uri, `products/${product.id}/${Date.now()}`);
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
          dialogTitle: `${product.name} - Product Catalog`,
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

  const generateProductPDF = async (product: Product, canSeePrice: boolean) => {
    try {
      // Function to create individual image pages
      const generateImagePages = (images: string[]) => {
        return images.map(image => `
          <div class="image-page">
            <div class="image-container">
              <img src="${image}" class="page-image" />
            </div>
          </div>
        `).join('');
      };
  
      // Get category names
      const categoryName = getCategoryNameById(product.category || product.categoryId);
      const subcategoryName = product.subcategory ? getSubcategoryNameById(product.category || product.categoryId, product.subcategory) : '';
      const subsubcategoryName = product.subsubcategory ? getSubsubcategoryNameById(product.category || product.categoryId, product.subcategory, product.subsubcategory) : '';
  
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 0;
                margin: 0;
              }
              .image-page { 
                page-break-after: always;
                height: 100vh;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
                box-sizing: border-box;
              }
              .image-container {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .page-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              /* Ensure the last page doesn't have a page break after it */
              .image-page:last-child {
                page-break-after: auto;
              }
            </style>
          </head>
          <body>
            ${product.images && product.images.length > 0 ? 
              generateImagePages(product.images) : ''}
          </body>
        </html>
      `;
  
      // Generate the PDF with default name
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      // Create a sanitized product name for the filename
      const sanitizedName = product.name 
        ? product.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50) 
        : 'product_details';
      
      // Get the directory and create a new filename with the product name
      const directory = uri.substring(0, uri.lastIndexOf('/') + 1);
      const newUri = `${directory}${sanitizedName}.pdf`;
      
      // Rename the file
      await FileSystem.moveAsync({
        from: uri,
        to: newUri
      });
      
      return newUri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const renderImageModal = () => {
    if (!product?.images || product.images.length === 0) return null;
    
    return (
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
        supportedOrientations={['portrait', 'landscape']}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal} 
                style={{ padding: 15, zIndex: 100 }}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.imageCounter}>
                {`${currentModalImage + 1} / ${product.images.length}`}
              </Text>
            </View>
            
            <FlatList
              ref={flatListRef}
              data={product.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex}
              scrollEnabled={true}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.floor(e.nativeEvent.contentOffset.x / width);
                setCurrentModalImage(newIndex);
              }}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={styles.modalImageContainer}>
                  <ImageZoom
                    uri={item}
                    minScale={0.5}
                    maxScale={5}
                    doubleTapScale={3}
                    maxPanPointers={2}
                    isSingleTapEnabled={true}
                    isDoubleTapEnabled={true}
                    style={{
                      width: width,
                      height: height,
                    }}
                    resizeMode="contain"
                  />
                </View>
              )}
              keyExtractor={(_, index) => `modal-image-${index}`}
            />

            <View style={styles.paginationDots}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentModalImage === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    );
  };

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
          <ScrollView 
            ref={scrollViewRef}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FB8A13']}
                tintColor={colorScheme === 'dark' ? '#FB8A13' : '#FB8A13'}
              />
            }
          >
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
                    <OptimizedImage
                      uri={image}
                      style={styles.image}
                      resizeMode="contain"
                      placeholder={
                        <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                          <ThemedText>Loading...</ThemedText>
                        </View>
                      }
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
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
              <ThemedText type="title" style={[styles.name, { paddingHorizontal: 16 }]}>
                {product.name}
              </ThemedText>
              <ThemedText style={[styles.description, { paddingHorizontal: 16 }]}>
                {product.description}
              </ThemedText>
              {!canSeePrice() ? (
                <ThemedText style={[styles.contactMessage, { paddingHorizontal: 16 }]}>
                Please contact us for pricing information
                </ThemedText>
              ) : ( 
                <ThemedText style={[styles.price, { paddingHorizontal: 16 }]}>
                RM{parseFloat(product.price).toFixed(2)}
              </ThemedText>
              )}
              {(product.category || product.categoryId) && (
                <View style={[styles.categoryContainer, { paddingHorizontal: 16 }]}>
                  <ThemedText style={styles.categoryLabel}>Category:</ThemedText>
                  <View style={styles.categoryPath}>
                    <View style={styles.categoryItemContainer}>
                      <ThemedText style={styles.categoryItem}>{getCategoryNameById(product.category || product.categoryId)}</ThemedText>
                    </View>
                    {product.subcategory && (
                      <>
                        <Ionicons name="chevron-forward" size={16} color={colorScheme === 'dark' ? '#ccc' : '#666'} />
                        <View style={styles.categoryItemContainer}>
                          <ThemedText style={styles.categoryItem}>{getSubcategoryNameById(product.category || product.categoryId, product.subcategory)}</ThemedText>
                        </View>
                      </>
                    )}
                    {product.subsubcategory && (
                      <>
                        <Ionicons name="chevron-forward" size={16} color={colorScheme === 'dark' ? '#ccc' : '#666'} />
                        <View style={styles.categoryItemContainer}>
                          <ThemedText style={styles.categoryItem}>{getSubsubcategoryNameById(product.category || product.categoryId, product.subcategory, product.subsubcategory)}</ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.imageGrid}>
                <ThemedText style={{ marginBottom: 16, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16 }}>
                  All Images
                </ThemedText>
                {product?.images?.map((image, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.gridImageContainer}
                    onPress={() => handleGridImagePress(index)}
                  >
                    <OptimizedImage
                      uri={image}
                      style={[
                        styles.gridImage,
                        activeImageIndex === index && styles.activeGridImage
                      ]}
                      resizeMode="contain"
                      placeholder={
                        <View style={[styles.gridImage, { justifyContent: 'center', alignItems: 'center' }]}>
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

      {renderImageModal()}

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
