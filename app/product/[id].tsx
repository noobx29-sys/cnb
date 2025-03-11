import { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Product, updateProduct, uploadImage, Category as FirebaseCategory, getAllCategories } from '@/services/firebase';
import { Colors } from '@/constants/Colors';
import { GestureHandlerRootView, PinchGestureHandler, State, PanGestureHandler, TapGestureHandler, PinchGestureHandlerGestureEvent, PanGestureHandlerGestureEvent, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
  withTiming,
  runOnJS,
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
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';

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
  const [categories, setCategories] = useState<FirebaseCategory[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentModalImage, setCurrentModalImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { canManageProducts } = usePermissions();
  const { canSeePrice } = usePermissions();
  const router = useRouter();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);
  const doubleTapRef = useRef(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [sliderValue, setSliderValue] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false);

  const lastScale = useSharedValue(1);

  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: () => {
      // Store the current scale when the gesture starts
      lastScale.value = scale.value;
      runOnJS(setIsGestureActive)(true);
    },
    onActive: (event) => {
      // Calculate new scale based on the pinch gesture
      // Add a small threshold for Android to prevent jittery behavior
      const scaleFactor = Platform.OS === 'android' ? 0.95 * event.scale : event.scale;
      const newScale = Math.min(Math.max(lastScale.value * scaleFactor, 1), 5); // Limit zoom between 1x and 5x
      scale.value = newScale;
      
      // Update slider value in real-time during pinch
      runOnJS(setSliderValue)(newScale);
      
      // Update isZoomed state when scale changes
      if (newScale > 1 && !isZoomed) {
        runOnJS(setIsZoomed)(true);
        runOnJS(setShowZoomControls)(true);
        runOnJS(setZoomedImageIndex)(currentModalImage);
      } else if (newScale <= 1 && isZoomed) {
        runOnJS(setIsZoomed)(false);
        runOnJS(setShowZoomControls)(false);
        runOnJS(setZoomedImageIndex)(null);
      }
    },
    onEnd: () => {
      savedScale.value = scale.value;
      runOnJS(setIsGestureActive)(false);
      // If scale is less than 1, spring back to 1
      if (scale.value < 1) {
        scale.value = withSpring(1, { damping: Platform.OS === 'android' ? 20 : 15 });
        savedScale.value = 1;
        runOnJS(setSliderValue)(1);
      }
      // If scale is back to 1, reset translation
      if (scale.value === 1) {
        translateX.value = withSpring(0, { damping: Platform.OS === 'android' ? 20 : 15 });
        translateY.value = withSpring(0, { damping: Platform.OS === 'android' ? 20 : 15 });
        lastTranslateX.value = 0;
        lastTranslateY.value = 0;
        runOnJS(setIsZoomed)(false);
        runOnJS(setShowZoomControls)(false);
      }
    },
  });

  const panHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
      runOnJS(setIsGestureActive)(true);
    },
    onActive: (event) => {
      // Only allow panning when zoomed in
      if (scale.value > 1) {
        // Calculate boundaries based on current zoom level
        const maxTranslateX = (scale.value - 1) * (width / 2);
        const maxTranslateY = (scale.value - 1) * (height / 2);
        
        // Apply translation with boundaries
        // Add a small dampening factor for Android to make panning smoother
        const translationFactor = Platform.OS === 'android' ? 0.95 : 1;
        translateX.value = Math.min(
          Math.max(lastTranslateX.value + event.translationX * translationFactor, -maxTranslateX), 
          maxTranslateX
        );
        translateY.value = Math.min(
          Math.max(lastTranslateY.value + event.translationY * translationFactor, -maxTranslateY), 
          maxTranslateY
        );
      }
    },
    onEnd: () => {
      // Save the final translation values
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
      runOnJS(setIsGestureActive)(false);
      
      // If scale is back to 1, reset translation
      if (scale.value === 1) {
        translateX.value = withSpring(0, { damping: Platform.OS === 'android' ? 20 : 15 });
        translateY.value = withSpring(0, { damping: Platform.OS === 'android' ? 20 : 15 });
        lastTranslateX.value = 0;
        lastTranslateY.value = 0;
      }
    },
  });

  const doubleTapHandler = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: (event) => {
      if (scale.value > 1) {
        // If already zoomed in, zoom out
        scale.value = withTiming(1, { duration: Platform.OS === 'android' ? 250 : 300 });
        savedScale.value = 1;
        translateX.value = withTiming(0, { duration: Platform.OS === 'android' ? 250 : 300 });
        translateY.value = withTiming(0, { duration: Platform.OS === 'android' ? 250 : 300 });
        lastTranslateX.value = 0;
        lastTranslateY.value = 0;
        runOnJS(setIsZoomed)(false);
        runOnJS(setShowZoomControls)(false);
        runOnJS(setSliderValue)(1);
        runOnJS(setZoomedImageIndex)(null);
      } else {
        // If zoomed out, zoom in to 2x at the tap location
        const targetScale = 2;
        
        // Calculate the focal point for zooming
        // This centers the zoom on the tap location
        const tapX = event.x;
        const tapY = event.y;
        
        // Calculate the center of the image
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Calculate the offset from center
        const offsetX = (tapX - centerX) * (1 - targetScale);
        const offsetY = (tapY - centerY) * (1 - targetScale);
        
        // Apply the zoom and translation
        scale.value = withTiming(targetScale, { duration: Platform.OS === 'android' ? 250 : 300 });
        savedScale.value = targetScale;
        translateX.value = withTiming(offsetX, { duration: Platform.OS === 'android' ? 250 : 300 });
        translateY.value = withTiming(offsetY, { duration: Platform.OS === 'android' ? 250 : 300 });
        lastTranslateX.value = offsetX;
        lastTranslateY.value = offsetY;
        
        runOnJS(setIsZoomed)(true);
        runOnJS(setShowZoomControls)(true);
        runOnJS(setSliderValue)(targetScale);
        runOnJS(setZoomedImageIndex)(currentModalImage);
      }
    },
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: '100%',
      height: '100%',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
    };
  });

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
    const loadCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        console.log('Loaded categories:', fetchedCategories);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    loadCategories();
  }, []);

  // Function to find category name by ID
  const getCategoryNameById = (categoryId: string | null): string => {
    if (!categoryId) return '';
    
    console.log('Finding category name for ID:', categoryId);
    // Find the category with matching ID
    const category = categories.find(cat => cat.id === categoryId);
    const result = category ? category.name : categoryId;
    console.log('Found category name:', result);
    return result;
  };
  
  // Function to find subcategory name by ID
  const getSubcategoryNameById = (categoryId: string | null, subcategoryId: string | null): string => {
    if (!categoryId || !subcategoryId) return '';
    
    console.log('Finding subcategory name for category ID:', categoryId, 'subcategory ID:', subcategoryId);
    // Find the category
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || !category.subCategories) {
      console.log('Category not found or has no subcategories, returning ID:', subcategoryId);
      return subcategoryId;
    }
    
    // Find the subcategory
    const subcategory = category.subCategories.find(sub => sub.id === subcategoryId);
    const result = subcategory ? subcategory.name : subcategoryId;
    console.log('Found subcategory name:', result);
    return result;
  };
  
  // Function to find subsubcategory name by ID
  const getSubsubcategoryNameById = (categoryId: string | null, subcategoryId: string | null, subsubcategoryId: string | null): string => {
    if (!categoryId || !subcategoryId || !subsubcategoryId) return '';
    
    console.log('Finding subsubcategory name for category ID:', categoryId, 'subcategory ID:', subcategoryId, 'subsubcategory ID:', subsubcategoryId);
    // Find the category
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || !category.subCategories) {
      console.log('Category not found or has no subcategories, returning ID:', subsubcategoryId);
      return subsubcategoryId;
    }
    
    // Find the subcategory
    const subcategory = category.subCategories.find(sub => sub.id === subcategoryId);
    if (!subcategory || !subcategory.subCategories) {
      console.log('Subcategory not found or has no subsubcategories, returning ID:', subsubcategoryId);
      return subsubcategoryId;
    }
    
    // Find the subsubcategory
    const subsubcategory = subcategory.subCategories.find(subsub => subsub.id === subsubcategoryId);
    const result = subsubcategory ? subsubcategory.name : subsubcategoryId;
    console.log('Found subsubcategory name:', result);
    return result;
  };

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
    modalImageContainer: {
      width: width,
      height: height,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
    },
    modalImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      backgroundColor: 'transparent', // Ensure background is transparent
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
    zoomInstructions: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
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
      overflow: 'visible', // Allow content to expand beyond boundaries
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
      // Remove border styles completely
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
    zoomSliderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginTop: 8,
      justifyContent: 'space-between',
      paddingHorizontal: Platform.OS === 'android' ? 10 : 0, // Add padding on Android
    },
    zoomSlider: {
      flex: 1,
      height: Platform.OS === 'android' ? 40 : 40,
      marginHorizontal: 10,
      ...(Platform.OS === 'android' && {
        // Android-specific slider styles
        marginVertical: 8,
      }),
    },
    resetZoomButton: {
      padding: 8,
      ...(Platform.OS === 'android' && {
        // Android-specific button styles
        padding: 12, // Larger touch target on Android
      }),
    },
    zoomIndicator: {
      position: 'absolute',
      top: '50%',
      alignSelf: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 20,
      padding: Platform.OS === 'android' ? 12 : 10,
      zIndex: 10,
      ...(Platform.OS === 'android' && {
        // Android-specific indicator styles
        elevation: 5,
      }),
    },
    zoomIndicatorText: {
      color: 'white',
      fontSize: Platform.OS === 'android' ? 18 : 16, // Larger text on Android
      fontWeight: 'bold',
    },
    zoomControlsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      ...(Platform.OS === 'android' && {
        // Android-specific header styles
        paddingVertical: 5,
      }),
    },
    zoomModeText: {
      color: '#FB8A13',
      fontWeight: 'bold',
      marginRight: 10,
    },
  });

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
      const categoryName = getCategoryNameById(product.category);
      const subcategoryName = product.subcategory ? getSubcategoryNameById(product.category, product.subcategory) : '';
      const subsubcategoryName = product.subsubcategory ? getSubsubcategoryNameById(product.category, product.subcategory, product.subsubcategory) : '';
  
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

  const handleSliderChange = (value: number) => {
    // Update the slider value state
    setSliderValue(value);
    
    // Update the animated values with proper animations for Android
    if (Platform.OS === 'android') {
      // Use timing animation for smoother transitions on Android
      scale.value = withTiming(value, { duration: 100 });
      savedScale.value = value;
    } else {
      // Direct update for iOS (already smooth)
      scale.value = value;
      savedScale.value = value;
    }
    
    // Update isZoomed state based on scale value
    if (value > 1 && !isZoomed) {
      setIsZoomed(true);
      setZoomedImageIndex(currentModalImage);
    } else if (value <= 1 && isZoomed) {
      setIsZoomed(false);
      setZoomedImageIndex(null);
      // Reset translation when zooming out completely
      if (Platform.OS === 'android') {
        translateX.value = withTiming(0, { duration: 100 });
        translateY.value = withTiming(0, { duration: 100 });
      } else {
        translateX.value = 0;
        translateY.value = 0;
      }
      lastTranslateX.value = 0;
      lastTranslateY.value = 0;
    }
  };

  const resetZoom = () => {
    if (Platform.OS === 'android') {
      scale.value = withTiming(1, { duration: 150 });
      translateX.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(0, { duration: 150 });
    } else {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    }
    savedScale.value = 1;
    lastTranslateX.value = 0;
    lastTranslateY.value = 0;
    setIsZoomed(false);
    setShowZoomControls(false);
    setSliderValue(1);
    setZoomedImageIndex(null);
  };

  const openModal = (index: number) => {
    // Reset scale values when opening modal
    resetZoom();
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    resetZoom();
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
                RM{product.price.toFixed(2)}
              </ThemedText>
              )}
              {/* <ThemedText style={styles.stock}>
                Stock: {product.stock}
              </ThemedText> */}
              {product.category && (
                <View style={[styles.categoryContainer, { paddingHorizontal: 16 }]}>
                  <ThemedText style={styles.categoryLabel}>Category:</ThemedText>
                  <View style={styles.categoryPath}>
                    <View style={styles.categoryItemContainer}>
                      <ThemedText style={styles.categoryItem}>{getCategoryNameById(product.category)}</ThemedText>
                    </View>
                    {product.subcategory && (
                      <>
                        <Ionicons name="chevron-forward" size={16} color={colorScheme === 'dark' ? '#ccc' : '#666'} />
                        <View style={styles.categoryItemContainer}>
                          <ThemedText style={styles.categoryItem}>{getSubcategoryNameById(product.category, product.subcategory)}</ThemedText>
                        </View>
                      </>
                    )}
                    {product.subsubcategory && (
                      <>
                        <Ionicons name="chevron-forward" size={16} color={colorScheme === 'dark' ? '#ccc' : '#666'} />
                        <View style={styles.categoryItemContainer}>
                          <ThemedText style={styles.categoryItem}>{getSubsubcategoryNameById(product.category, product.subcategory, product.subsubcategory)}</ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Add Image Grid for all images */}
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
                    <CachedImage
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
            {showZoomControls && (
              <View style={styles.zoomControlsHeader}>
                <Text style={styles.zoomModeText}>Zoom Mode</Text>
                <TouchableOpacity onPress={resetZoom} style={styles.resetZoomButton}>
                  <Ionicons name="refresh" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isGestureActive && (
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomIndicatorText}>{Math.round(sliderValue * 100)}%</Text>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={isZoomed ? [product?.images?.[zoomedImageIndex!]] : product?.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={isZoomed ? 0 : selectedImageIndex}
            scrollEnabled={!isZoomed}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ 
                  index: isZoomed ? 0 : selectedImageIndex, 
                  animated: false 
                });
              }, 100);
            }}
            onMomentumScrollEnd={(e) => {
              if (!isZoomed) {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentModalImage(newIndex);
                // Reset zoom when changing images
                resetZoom();
              }
            }}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item, index }) => (
              <View style={styles.modalImageContainer}>
                <TapGestureHandler
                  ref={doubleTapRef}
                  numberOfTaps={2}
                  onGestureEvent={doubleTapHandler}
                >
                  <ReAnimated.View style={styles.zoomableImage}>
                    <PanGestureHandler onGestureEvent={panHandler}>
                      <ReAnimated.View style={styles.zoomableImage}>
                        <PinchGestureHandler onGestureEvent={pinchHandler}>
                          <ReAnimated.View style={[styles.zoomableImage, animatedImageStyle]}>
                            <Image
                              source={{ uri: item }}
                              style={styles.modalImage}
                              resizeMode="contain"
                            />
                          </ReAnimated.View>
                        </PinchGestureHandler>
                      </ReAnimated.View>
                    </PanGestureHandler>
                  </ReAnimated.View>
                </TapGestureHandler>
              </View>
            )}
            keyExtractor={(_, index) => `modal-image-${index}`}
          />

          <View style={styles.modalFooter}>
            <Text style={styles.imageCounter}>
              {isZoomed 
                ? `Zoomed: ${zoomedImageIndex! + 1} / ${product?.images?.length}`
                : `${currentModalImage + 1} / ${product?.images?.length}`
              }
            </Text>
            
            {showZoomControls ? (
              <View style={styles.zoomSliderContainer}>
                <TouchableOpacity 
                  onPress={() => handleSliderChange(Math.max(1, sliderValue - 0.5))}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name="remove-circle-outline" size={24} color="white" />
                </TouchableOpacity>
                
                <Slider
                  style={[
                    styles.zoomSlider,
                    Platform.OS === 'android' && { height: 40 } // Increase touch area on Android
                  ]}
                  minimumValue={1}
                  maximumValue={5}
                  step={Platform.OS === 'android' ? 0.2 : 0.1} // Larger steps on Android for better performance
                  value={sliderValue}
                  onValueChange={handleSliderChange}
                  minimumTrackTintColor="#FB8A13"
                  maximumTrackTintColor="#FFFFFF"
                  thumbTintColor="#FB8A13"
                  tapToSeek={Platform.OS === 'android'} // Enable tap-to-seek on Android
                />
                
                <TouchableOpacity 
                  onPress={() => handleSliderChange(Math.min(5, sliderValue + 0.5))}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name="add-circle-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.zoomInstructions}>
                Pinch to zoom • Double tap to zoom in/out • Drag to move when zoomed
              </Text>
            )}
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
