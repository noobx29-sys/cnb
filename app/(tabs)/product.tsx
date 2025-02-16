import { useEffect, useState } from 'react';
import { StyleSheet, Pressable, Image, ActivityIndicator, ScrollView, SafeAreaView, RefreshControl, TextInput, useColorScheme, Platform, View, Dimensions } from 'react-native';
import { router, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Product, getAllProducts, getAllCategories } from '@/services/firebase';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductGridWidth, getContentWidth } from '@/utils/responsive';

interface SubCategory {
  id: string;
  name: string;
  subCategories?: Array<{
    id: string;
    name: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  path: string[];
  subCategories: SubCategory[];
  createdAt: Date;
}

export default function ProductScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { 
      id: 'all', 
      name: 'All Products',
      parentId: null,
      path: [],
      subCategories: [],
      createdAt: new Date()
    }
  ]);
  const [loading, setLoading] = useState(true);
  const { canManageProducts } = usePermissions();
  const { canSeePrice } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string | null>(null);
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    safeArea: {
      flex: 1,
      width: '100%',
    },
    scrollContainer: {
      flex: 1,
      width: '100%',
    },
    categoriesContainer: {
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.light.secondaryBackground,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: Colors.light.border,
    },
    selectedCategory: {
      backgroundColor: Colors.light.tint,
      borderColor: Colors.light.tint,
    },
    categoryName: {
      fontSize: 14,
      color: Colors.light.text,
      fontWeight: '500',
    },
    selectedCategoryText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      gap: 12,
    },
    productCard: {
      width: '48%',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 0,
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
      width: '100%',
      marginTop: Platform.OS === 'android' ? 8 : 0,
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
    parentOfSelected: {
      backgroundColor: Colors.light.tint,
    },
    parentOfSelectedText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    subCategoriesContainer: {
      paddingVertical: 2,
      paddingHorizontal: 8,
    },
    subCategoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: 'rgba(32, 34, 35, 0.9)',
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: 'rgba(64, 66, 67, 0.5)',
    },
    selectedSubCategory: {
      backgroundColor: Colors.light.tint,
      borderColor: Colors.light.tint,
    },
    subCategoryName: {
      fontSize: 13,
      color: '#FFFFFF',
      opacity: 0.95,
    },
    selectedSubCategoryText: {
      color: '#FFFFFF',
      fontWeight: '600',
      opacity: 1,
    },
    subSubCategoriesContainer: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    subSubCategoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(32, 34, 35, 0.8)',
      marginHorizontal: 4,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(64, 66, 67, 0.4)',
    },
    selectedSubSubCategory: {
      backgroundColor: 'transparent',
      borderColor: Colors.light.tint,
    },
    subSubCategoryName: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.95,
    },
    selectedSubSubCategoryText: {
      color: Colors.light.tint,
      fontWeight: '500',
      opacity: 1,
    },
    contactMessage: {
      fontSize: 14,
      color: Colors.light.tint,
      fontWeight: 'bold',
      padding: 8,
      paddingTop: 0,
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
      
      // Transform fetched categories to match local Category interface
      const transformedCategories = fetchedCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        parentId: null,
        path: [],
        subCategories: cat.subCategories || [],
        createdAt: cat.createdAt
      }));
      
      setAllProducts(products);
      setCategories([
        { 
          id: 'all', 
          name: 'All Products',
          parentId: null,
          path: [],
          subCategories: [],
          createdAt: new Date()
        },
        ...transformedCategories
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    return allProducts.filter(product => {
      // First check if search query matches
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If no category is selected (All Products), only filter by search
      if (!selectedCategory || selectedCategory === 'all') {
        return matchesSearch;
      }
      
      // Get the selected category data
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      if (!selectedCategoryData) return false;
      
      // If only category is selected (no subcategory), show all products in that category and its subcategories
      if (!selectedSubCategory) {
        return product.category === selectedCategoryData.name && matchesSearch;
      }
      
      // Get the selected subcategory data
      const selectedSubCategoryData = selectedCategoryData.subCategories?.find(
        sub => sub.id === selectedSubCategory
      );
      if (!selectedSubCategoryData) return false;
      
      // If subcategory is selected but no sub-subcategory, show all products in that subcategory
      if (!selectedSubSubCategory) {
        return product.subcategory === selectedSubCategoryData.name && matchesSearch;
      }
      
      // Get the selected sub-subcategory data
      const selectedSubSubCategoryData = selectedSubCategoryData.subCategories?.find(
        subsub => subsub.id === selectedSubSubCategory
      );
      if (!selectedSubSubCategoryData) return false;
      
      // If sub-subcategory is selected, only show products in that specific sub-subcategory
      return (
        product.category === selectedCategoryData.name &&
        product.subcategory === selectedSubCategoryData.name &&
        product.subsubcategory === selectedSubSubCategoryData.name &&
        matchesSearch
      );
    });
  };

  const filteredProducts = getFilteredProducts();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(null);
    setSelectedSubSubCategory(null);
  };

  const handleSubCategorySelect = (subcategoryId: string | null) => {
    setSelectedSubCategory(subcategoryId);
    setSelectedSubSubCategory(null);
  };

  const renderSubCategories = () => {
    if (!selectedCategory || selectedCategory === 'all') return null;
    
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData?.subCategories?.length) return null;

    return (
      <ThemedView style={styles.subCategoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedCategoryData.subCategories.map(subCategory => {
            const isSelected = selectedSubCategory === subCategory.id;
            return (
              <Pressable
                key={subCategory.id}
                style={[
                  styles.subCategoryChip,
                  isSelected && styles.selectedSubCategory,
                ]}
                onPress={() => handleSubCategorySelect(isSelected ? null : subCategory.id)}>
                <ThemedText 
                  style={[
                    styles.subCategoryName,
                    isSelected && styles.selectedSubCategoryText
                  ]}>
                  {subCategory.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </ThemedView>
    );
  };

  const renderSubSubCategories = () => {
    if (!selectedCategory || !selectedSubCategory) return null;
    
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    const selectedSubCategoryData = selectedCategoryData?.subCategories?.find(
      sub => sub.id === selectedSubCategory
    );
    
    if (!selectedSubCategoryData?.subCategories?.length) return null;

    return (
      <ThemedView style={styles.subSubCategoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedSubCategoryData.subCategories.map(subsubCategory => {
            const isSelected = selectedSubSubCategory === subsubCategory.id;
            return (
              <Pressable
                key={subsubCategory.id}
                style={[
                  styles.subSubCategoryChip,
                  isSelected && styles.selectedSubSubCategory,
                ]}
                onPress={() => setSelectedSubSubCategory(isSelected ? null : subsubCategory.id)}>
                <ThemedText 
                  style={[
                    styles.subSubCategoryName,
                    isSelected && styles.selectedSubSubCategoryText
                  ]}>
                  {subsubCategory.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar 
        backgroundColor="transparent"
        translucent={true}
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
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
            <Pressable
              style={[
                styles.categoryChip,
                !selectedCategory && styles.selectedCategory,
              ]}
              onPress={() => {
                setSelectedCategory(null);
                setSelectedSubCategory(null);
              }}>
              <ThemedText 
                style={[
                  styles.categoryName,
                  !selectedCategory && styles.selectedCategoryText
                ]}>
                All Products
              </ThemedText>
            </Pressable>
            {categories
              .filter(cat => !cat.parentId && cat.id !== 'all')
              .map(category => {
                const isSelected = selectedCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.selectedCategory,
                    ]}
                    onPress={() => handleCategorySelect(category.id)}>
                    <ThemedText 
                      style={[
                        styles.categoryName,
                        isSelected && styles.selectedCategoryText
                      ]}>
                      {category.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
          </ScrollView>
        </ThemedView>
        {renderSubCategories()}
        {renderSubSubCategories()}
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
                  {canSeePrice() ? (
                    <ThemedText style={styles.productPrice}>
                      RM{product.price.toFixed(2)}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.contactMessage}>
                      Contact us for price
                    </ThemedText>
                  )}
                </Pressable>
              ))
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
