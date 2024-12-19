import { useEffect, useState } from 'react';
import { StyleSheet, Pressable, Image, ActivityIndicator, ScrollView, SafeAreaView, RefreshControl, TextInput, useColorScheme, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Product, getAllProducts, getAllCategories } from '@/services/firebase';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Products' }
  ]);
  const [loading, setLoading] = useState(true);
  const { canManageProducts } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

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
    scrollContainer: {
      flex: 1,
    },
    categoriesContainer: {
      paddingVertical: 12,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.light.secondaryBackground,
      marginHorizontal: 4,
    },
    selectedCategory: {
      backgroundColor: Colors.light.tint,
    },
    categoryName: {
      fontSize: 14,
      color: '#000000',
    },
    selectedCategoryText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 8,
      gap: 8,
    },
    productCard: {
      width: '48%',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 8,
      backgroundColor: Colors.light.secondaryBackground,
    },
    productImage: {
      width: '100%',
      height: 180,
      resizeMode: 'cover',
    },
    productName: {
      fontSize: 14,
      padding: 8,
      paddingBottom: 4,
      color: '#000000',
      fontWeight: 'bold',
    },
    productPrice: {
      fontSize: 16,
      color: Colors.light.tint,
      fontWeight: 'bold',
      padding: 8,
      paddingTop: 0,
    },
    noProducts: {
      textAlign: 'center',
      padding: 20,
      width: '100%',
    },
    searchContainer: {
      padding: 8,
    },
    searchInput: {
      color: '#999999',
      height: 48,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
    },
    skeletonCard: {
      width: '48%',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 8,
      backgroundColor: Colors.light.secondaryBackground,
    },
    skeletonImage: {
      width: '100%',
      height: 180,
      backgroundColor: '#E0E0E0',
    },
    skeletonText: {
      height: 16,
      backgroundColor: '#E0E0E0',
      borderRadius: 4,
      margin: 8,
    },
    skeletonPrice: {
      width: '40%',
      height: 16,
      backgroundColor: '#E0E0E0',
      borderRadius: 4,
      margin: 8,
      marginTop: 0,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [products, fetchedCategories] = await Promise.all([
        getAllProducts(),
        getAllCategories()
      ]);
      
      console.log('Fetched products:', products);
      console.log('Fetched categories:', fetchedCategories);
      
      setAllProducts(products);
      setCategories([
        { id: 'all', name: 'All Products' },
        ...fetchedCategories
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    return allProducts.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === categories.find(cat => cat.id === selectedCategory)?.name;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const filteredProducts = getFilteredProducts();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor='#999999'
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </ThemedView>
      <ThemedView style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category.id)}>
              <ThemedText 
                style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}>
                {category.name}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </ThemedView>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FB8A13']} // Android
            tintColor="#FB8A13" // iOS
          />
        }
      >
        <ThemedView style={styles.productsContainer}>
          {loading ? (
            <ThemedView style={styles.productsContainer}>
              {[...Array(6)].map((_, index) => (
                <View key={`skeleton-${index}`} style={styles.skeletonCard}>
                  <View style={styles.skeletonImage} />
                  <View style={styles.skeletonText} />
                  <View style={styles.skeletonPrice} />
                </View>
              ))}
            </ThemedView>
          ) : filteredProducts.length === 0 ? (
            <ThemedText style={styles.noProducts}>No products found</ThemedText>
          ) : (
            filteredProducts.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => router.push(`/product/${product.id}`)}
                style={styles.productCard}
              >
                {product.images && product.images[0] && (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                  />
                )}
                <ThemedText numberOfLines={2} style={styles.productName}>
                  {product.name}
                </ThemedText>
                <ThemedText style={styles.productPrice}>
                  RM{product.price.toFixed(2)}
                </ThemedText>
              </Pressable>
            ))
          )}
        </ThemedView>
      </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
