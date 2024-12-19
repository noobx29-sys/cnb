import { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Make sure you have this package installed
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Product, getAllProducts } from '@/services/firebase';
import { Colors } from '@/constants/Colors';
import { GestureHandlerRootView, PinchGestureHandler, State, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function ProductViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: (_event, context) => {
      (context as { startScale: number }).startScale = scale.value;
    },
    onActive: (event, context) => {
      scale.value = (context as { startScale: number }).startScale * event.scale;
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
      width: width,
      height: width,
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
      width: '100%',
      height: '100%',
    },
    modalPagination: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
    },
    zoomableImage: {
      width: width,
      height: height,
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
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      }
    };
    loadProduct();
  }, [id]);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    scale.value = 1;
    savedScale.value = 1;
    setModalVisible(false);
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView>
            {/* Image Carousel */}
            <View>
              <TouchableOpacity onPress={() => handleShare()} style={styles.shareButton}>
                <Ionicons name="share-outline" size={24} color="#FB8A13" />
              </TouchableOpacity>
              <ScrollView
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
                    <Image
                      source={{ uri: image }}
                      style={styles.image}
                      resizeMode="cover"
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
              <Animated.Image
                source={{ uri: product?.images?.[selectedImageIndex] }}
                style={[styles.fullScreenImage, animatedImageStyle]}
                resizeMode="contain"
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
    </GestureHandlerRootView>
  );
}
