import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Pressable, Image, ActivityIndicator, ScrollView, SafeAreaView, RefreshControl, TextInput, useColorScheme, Platform, View, Dimensions, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';
import { OptimizedImage } from '@/components/OptimizedImage';

// Define available sort methods
type SortMethod = 'alphabetical' | 'priceHighToLow' | 'priceLowToHigh';

interface SubCategory {
  id: string;
  name: string;
  order?: number;
  subCategories?: Array<{
    id: string;
    name: string;
    order?: number;
  }>;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  path: string[];
  subCategories: SubCategory[];
  createdAt: Date;
  order?: number;
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
      createdAt: new Date(),
      order: -1
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeLevel, setActiveLevel] = useState<'main' | 'sub' | 'subsub'>('main');
  const [tempSelectedCategory, setTempSelectedCategory] = useState<string | null>(null);
  const [tempSelectedSubCategory, setTempSelectedSubCategory] = useState<string | null>(null);
  const [tempSelectedSubSubCategory, setTempSelectedSubSubCategory] = useState<string | null>(null);
  const [guestBannerVisible, setGuestBannerVisible] = useState(true);
  const { isGuest } = useAuth();
  
  // Add sort state - default to alphabetical
  const [sortMethod, setSortMethod] = useState<SortMethod>('alphabetical');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Function to get category/subcategory/subsubcategory name from ID
  const getCategoryNameById = (categoryId: string | null): string => {
    if (!categoryId) return '';
    
    // Check if it's a main category
    const mainCategory = categories.find(cat => cat.id === categoryId);
    if (mainCategory) return mainCategory.name;
    
    // Check if it's a subcategory
    for (const category of categories) {
      const subCategory = category.subCategories?.find(sub => sub.id === categoryId);
      if (subCategory) return subCategory.name;
      
      // Check if it's a sub-subcategory
      for (const subCat of category.subCategories || []) {
        const subSubCategory = subCat.subCategories?.find(subSub => subSub.id === categoryId);
        if (subSubCategory) return subSubCategory.name;
      }
    }
    
    return categoryId; // Return the ID if name not found
  };

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
      flexDirection: 'row',
      alignItems: 'center',
      ...(Platform.OS === 'ios' ? {
        shadowColor: colorScheme === 'dark' ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
        shadowRadius: 2,
      } : {
        elevation: colorScheme === 'dark' ? 0 : 2,
      }),
    },
    searchInput: {
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      height: 48,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      flex: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.secondaryBackground : Colors.light.secondaryBackground,
      ...(Platform.OS === 'ios' ? {
        shadowColor: colorScheme === 'dark' ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
        shadowRadius: 2,
      } : {
        elevation: colorScheme === 'dark' ? 0 : 2,
      }),
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? Colors.dark.secondaryBackground : Colors.light.secondaryBackground,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
      ...(Platform.OS === 'ios' ? {
        shadowColor: colorScheme === 'dark' ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
        shadowRadius: 2,
      } : {
        elevation: colorScheme === 'dark' ? 0 : 2,
      }),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 12,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalContent: {
      padding: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    categoryItemText: {
      fontSize: 16,
    },
    selectedCategoryItem: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(251, 138, 19, 0.2)' : 'rgba(251, 138, 19, 0.1)',
    },
    selectedCategoryItemText: {
      color: Colors.light.tint,
      fontWeight: 'bold',
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    modalButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    applyButton: {
      backgroundColor: Colors.light.tint,
    },
    cancelButton: {
      backgroundColor: colorScheme === 'dark' ? Colors.dark.secondaryBackground : Colors.light.secondaryBackground,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    applyButtonText: {
      color: '#FFFFFF',
    },
    cancelButtonText: {
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    },
    breadcrumb: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    breadcrumbItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    breadcrumbText: {
      fontSize: 14,
      color: Colors.light.tint,
    },
    breadcrumbSeparator: {
      marginHorizontal: 8,
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
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
      backgroundColor: 'rgba(32, 34, 35, 0.9)',
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: 'rgba(64, 66, 67, 0.5)',
    },
    selectedSubSubCategory: {
      backgroundColor: Colors.light.tint,
      borderColor: Colors.light.tint,
    },
    subSubCategoryName: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.95,
    },
    selectedSubSubCategoryText: {
      color: '#FFFFFF',
      fontWeight: '600',
      opacity: 1,
    },
    contactMessage: {
      fontSize: 14,
      color: Colors.light.tint,
      fontWeight: 'bold',
      padding: 8,
      paddingTop: 0,
    },
    categoryLabel: {
      fontSize: 12,
      color: Colors.light.text,
      opacity: 0.7,
      padding: 8,
      paddingTop: 0,
    },
    guestBanner: {
      backgroundColor: '#FB8A13',
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    guestBannerText: {
      color: '#FFFFFF',
      flex: 1,
      fontSize: 14,
    },
    guestBannerButton: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginLeft: 8,
    },
    guestBannerButtonText: {
      color: '#FB8A13',
      fontWeight: '600',
      fontSize: 12,
    },
    guestBannerCloseButton: {
      padding: 4,
    },
    sortButton: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? Colors.dark.secondaryBackground : Colors.light.secondaryBackground,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
      ...(Platform.OS === 'ios' ? {
        shadowColor: colorScheme === 'dark' ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
        shadowRadius: 2,
      } : {
        elevation: colorScheme === 'dark' ? 0 : 2,
      }),
    },
    sortOption: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    selectedSortOption: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(251, 138, 19, 0.2)' : 'rgba(251, 138, 19, 0.1)',
    },
    sortOptionText: {
      fontSize: 16,
    },
    selectedSortOptionText: {
      color: Colors.light.tint,
      fontWeight: 'bold',
    },
    sortModalContainer: {
      width: '80%',
      borderRadius: 12,
      overflow: 'hidden',
    },
    sortModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    },
    currentSortLabel: {
      fontSize: 12,
      color: colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted,
      marginRight: 8,
    },
    disabledSortOption: {
      backgroundColor: '#f2f2f2', // Light gray background for disabled items
    },
    disabledSortOptionText: {
      color: '#a0a0a0', // Medium gray text for disabled items
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
      
      // Transform fetched categories to match local Category interface and add order property
      const transformedCategories = fetchedCategories.map((cat: any, index: number) => ({
        id: cat.id,
        name: cat.name,
        parentId: null,
        path: [],
        subCategories: cat.subCategories || [],
        createdAt: cat.createdAt,
        order: cat.order !== undefined ? cat.order : index // Use order if available, otherwise use index
      }));
      
      // Sort categories by order
      const sortedCategories = transformedCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setAllProducts(products);
      setCategories([
        { 
          id: 'all', 
          name: 'All Products',
          parentId: null,
          path: [],
          subCategories: [],
          createdAt: new Date(),
          order: -1
        },
        ...sortedCategories
      ]);

      // Preload images for visible products once data is loaded
      preloadProductImages(products);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to preload images for optimal performance
  const preloadProductImages = useCallback((products: Product[]) => {
    if (!products || products.length === 0) return;
    
    // Get first 20 product images to preload (or fewer if there are less products)
    const imagesToPreload = products
      .slice(0, 20)
      .map(product => product.images && product.images[0])
      .filter(uri => !!uri) as string[];
    
    // Use the preload function from OptimizedImage
    if (imagesToPreload.length > 0) {
      OptimizedImage.preload(imagesToPreload);
    }
  }, []);

  const getFilteredProducts = () => {
    // Filter products as before
    const filtered = allProducts.filter(product => {
      // First check if search query matches
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If no category is selected (All Products), only filter by search
      if (!selectedCategory || selectedCategory === 'all') {
        return matchesSearch;
      }
      
      // If only category is selected (no subcategory), show all products in that category
      if (!selectedSubCategory) {
        return product.category === selectedCategory && matchesSearch;
      }
      
      // If subcategory is selected but no sub-subcategory, show all products in that subcategory
      if (!selectedSubSubCategory) {
        return product.category === selectedCategory && 
               product.subcategory === selectedSubCategory && 
               matchesSearch;
      }
      
      // If sub-subcategory is selected, only show products in that specific sub-subcategory
      return (
        product.category === selectedCategory &&
        product.subcategory === selectedSubCategory &&
        product.subsubcategory === selectedSubSubCategory &&
        matchesSearch
      );
    });
    
    // Apply sorting based on selected method
    return sortProducts(filtered);
  };
  
  // Function to sort products based on selected sort method
  const sortProducts = (products: Product[]) => {
    // If user is a guest and trying to use price sorting, force alphabetical
    if (isGuest && (sortMethod === 'priceHighToLow' || sortMethod === 'priceLowToHigh')) {
      return [...products].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    switch (sortMethod) {
      case 'alphabetical':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      case 'priceHighToLow':
        return [...products].sort((a, b) => b.price - a.price);
      case 'priceLowToHigh':
        return [...products].sort((a, b) => a.price - b.price);
      default:
        return products;
    }
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

    // Sort subcategories by order
    const sortedSubCategories = [...selectedCategoryData.subCategories]
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
      <ThemedView style={styles.subCategoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortedSubCategories.map(subCategory => {
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

    // Sort sub-subcategories by order
    const sortedSubSubCategories = [...selectedSubCategoryData.subCategories]
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
      <ThemedView style={styles.subSubCategoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortedSubSubCategories.map(subsubCategory => {
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

  const openFilterModal = () => {
    // Initialize temporary selections with current selections
    setTempSelectedCategory(selectedCategory);
    setTempSelectedSubCategory(selectedSubCategory);
    setTempSelectedSubSubCategory(selectedSubSubCategory);
    setActiveLevel('main');
    setFilterModalVisible(true);
  };

  const closeFilterModal = () => {
    setFilterModalVisible(false);
  };

  const applyFilter = () => {
    // Apply the temporary selections to the actual selections
    setSelectedCategory(tempSelectedCategory);
    setSelectedSubCategory(tempSelectedSubCategory);
    setSelectedSubSubCategory(tempSelectedSubSubCategory);
    closeFilterModal();
  };

  const resetFilter = () => {
    setTempSelectedCategory(null);
    setTempSelectedSubCategory(null);
    setTempSelectedSubSubCategory(null);
    setActiveLevel('main');
  };

  const handleCategoryPress = (categoryId: string) => {
    if (tempSelectedCategory === categoryId) {
      // If already selected, deselect it
      setTempSelectedCategory(null);
      setTempSelectedSubCategory(null);
      setTempSelectedSubSubCategory(null);
      setActiveLevel('main');
    } else {
      // Select the category and show subcategories if available
      setTempSelectedCategory(categoryId);
      setTempSelectedSubCategory(null);
      setTempSelectedSubSubCategory(null);
      
      const category = categories.find(cat => cat.id === categoryId);
      if (category && category.subCategories && category.subCategories.length > 0) {
        setActiveLevel('sub');
      } else {
        setActiveLevel('main');
      }
    }
  };

  const handleSubCategoryPress = (subCategoryId: string) => {
    if (tempSelectedSubCategory === subCategoryId) {
      // If already selected, deselect it
      setTempSelectedSubCategory(null);
      setTempSelectedSubSubCategory(null);
      setActiveLevel('sub');
    } else {
      // Select the subcategory and show sub-subcategories if available
      setTempSelectedSubCategory(subCategoryId);
      setTempSelectedSubSubCategory(null);
      
      const category = categories.find(cat => cat.id === tempSelectedCategory);
      const subCategory = category?.subCategories?.find(sub => sub.id === subCategoryId);
      
      if (subCategory && subCategory.subCategories && subCategory.subCategories.length > 0) {
        setActiveLevel('subsub');
      } else {
        setActiveLevel('sub');
      }
    }
  };

  const handleSubSubCategoryPress = (subSubCategoryId: string) => {
    if (tempSelectedSubSubCategory === subSubCategoryId) {
      // If already selected, deselect it
      setTempSelectedSubSubCategory(null);
    } else {
      // Select the sub-subcategory
      setTempSelectedSubSubCategory(subSubCategoryId);
    }
  };

  const navigateBack = () => {
    if (activeLevel === 'subsub') {
      setActiveLevel('sub');
      setTempSelectedSubSubCategory(null);
    } else if (activeLevel === 'sub') {
      setActiveLevel('main');
      setTempSelectedSubCategory(null);
    }
  };

  const renderFilterModalContent = () => {
    if (activeLevel === 'main') {
      // Render main categories with explicit sorting
      const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return (
        <ScrollView>
          {sortedCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                tempSelectedCategory === category.id && styles.selectedCategoryItem
              ]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <ThemedText 
                style={[
                  styles.categoryItemText,
                  tempSelectedCategory === category.id && styles.selectedCategoryItemText
                ]}
              >
                {category.name}
              </ThemedText>
              {category.subCategories && category.subCategories.length > 0 && (
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    } else if (activeLevel === 'sub') {
      // Render subcategories
      const selectedCategoryData = categories.find(cat => cat.id === tempSelectedCategory);
      
      // Sort subcategories by order
      const sortedSubCategories = selectedCategoryData?.subCategories 
        ? [...selectedCategoryData.subCategories].sort((a, b) => (a.order || 0) - (b.order || 0))
        : [];
      
      return (
        <ScrollView>
          {sortedSubCategories.map(subCategory => (
            <TouchableOpacity
              key={subCategory.id}
              style={[
                styles.categoryItem,
                tempSelectedSubCategory === subCategory.id && styles.selectedCategoryItem
              ]}
              onPress={() => handleSubCategoryPress(subCategory.id)}
            >
              <ThemedText 
                style={[
                  styles.categoryItemText,
                  tempSelectedSubCategory === subCategory.id && styles.selectedCategoryItemText
                ]}
              >
                {subCategory.name}
              </ThemedText>
              {subCategory.subCategories && subCategory.subCategories.length > 0 && (
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    } else if (activeLevel === 'subsub') {
      // Render sub-subcategories
      const selectedCategoryData = categories.find(cat => cat.id === tempSelectedCategory);
      const selectedSubCategoryData = selectedCategoryData?.subCategories?.find(
        sub => sub.id === tempSelectedSubCategory
      );
      
      // Sort sub-subcategories by order
      const sortedSubSubCategories = selectedSubCategoryData?.subCategories 
        ? [...selectedSubCategoryData.subCategories].sort((a, b) => (a.order || 0) - (b.order || 0))
        : [];
      
      return (
        <ScrollView>
          {sortedSubSubCategories.map(subSubCategory => (
            <TouchableOpacity
              key={subSubCategory.id}
              style={[
                styles.categoryItem,
                tempSelectedSubSubCategory === subSubCategory.id && styles.selectedCategoryItem
              ]}
              onPress={() => handleSubSubCategoryPress(subSubCategory.id)}
            >
              <ThemedText 
                style={[
                  styles.categoryItemText,
                  tempSelectedSubSubCategory === subSubCategory.id && styles.selectedCategoryItemText
                ]}
              >
                {subSubCategory.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
    
    return null;
  };

  const renderBreadcrumb = () => {
    if (activeLevel === 'main') return null;
    
    const selectedCategoryData = categories.find(cat => cat.id === tempSelectedCategory);
    const selectedSubCategoryData = selectedCategoryData?.subCategories?.find(
      sub => sub.id === tempSelectedSubCategory
    );
    
    return (
      <ThemedView style={styles.breadcrumb}>
        <TouchableOpacity style={styles.breadcrumbItem} onPress={() => setActiveLevel('main')}>
          <ThemedText style={styles.breadcrumbText}>All Categories</ThemedText>
        </TouchableOpacity>
        
        {selectedCategoryData && (
          <>
            <ThemedText style={styles.breadcrumbSeparator}>{'>'}</ThemedText>
            <TouchableOpacity 
              style={styles.breadcrumbItem} 
              onPress={() => activeLevel === 'subsub' ? setActiveLevel('sub') : null}
            >
              <ThemedText style={styles.breadcrumbText}>{selectedCategoryData.name}</ThemedText>
            </TouchableOpacity>
          </>
        )}
        
        {selectedSubCategoryData && activeLevel === 'subsub' && (
          <>
            <ThemedText style={styles.breadcrumbSeparator}>{'>'}</ThemedText>
            <ThemedView style={styles.breadcrumbItem}>
              <ThemedText style={styles.breadcrumbText}>{selectedSubCategoryData.name}</ThemedText>
            </ThemedView>
          </>
        )}
      </ThemedView>
    );
  };

  // Open sort modal
  const openSortModal = () => {
    setSortModalVisible(true);
  };

  // Close sort modal
  const closeSortModal = () => {
    setSortModalVisible(false);
  };

  // Handle sort selection
  const handleSortSelect = (method: SortMethod) => {
    // If user is a guest and trying to select price sorting, show sign-up prompt
    if (isGuest && (method === 'priceHighToLow' || method === 'priceLowToHigh')) {
      closeSortModal();
      // Force back to alphabetical
      setSortMethod('alphabetical');
      // Show sign-up prompt
      setGuestBannerVisible(true);
      return;
    }
    
    setSortMethod(method);
    closeSortModal();
  };
  
  // Get human-readable name for current sort method
  const getSortMethodName = (method: SortMethod): string => {
    switch (method) {
      case 'alphabetical':
        return 'Alphabetical (A-Z)';
      case 'priceHighToLow':
        return 'Price: High to Low';
      case 'priceLowToHigh':
        return 'Price: Low to High';
      default:
        return 'Alphabetical (A-Z)';
    }
  };

  // Modified function to render product items with optimized image priority
  const renderProductItem = (product: Product, index: number) => {
    // Determine image loading priority based on position
    // First few products get high priority, others get normal
    const imagePriority = index < 6 ? 'high' : 'normal';
    
    return (
      <Pressable
        key={product.id}
        onPress={() => router.push(`/product/${product.id}`)}
        style={styles.productCard}
      >
        {product.images && product.images[0] && (
          <OptimizedImage
            uri={product.images[0]}
            style={styles.productImage}
            resizeMode="cover"
            priority={imagePriority}
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
        {isGuest && guestBannerVisible && (
          <ThemedView style={styles.guestBanner}>
            <ThemedText style={styles.guestBannerText}>
              You're browsing as a guest. Sign up to see prices and access all features.
            </ThemedText>
            <Pressable 
              style={styles.guestBannerButton}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <ThemedText style={styles.guestBannerButtonText}>Sign Up</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.guestBannerCloseButton}
              onPress={() => setGuestBannerVisible(false)}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </ThemedView>
        )}
        
        <ThemedView style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="filter" 
              size={24} 
              color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sortButton} 
            onPress={openSortModal}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="swap-vertical" 
              size={24} 
              color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
            />
          </TouchableOpacity>
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
              // Ensure categories are sorted by order
              .sort((a, b) => (a.order || 0) - (b.order || 0))
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
          {/* Current Sort Method Indicator */}
          <ThemedView style={{flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center'}}>
            <ThemedText style={styles.currentSortLabel}>Sorted by:</ThemedText>
            <ThemedText style={{fontWeight: '500'}}>{getSortMethodName(sortMethod)}</ThemedText>
          </ThemedView>
          
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
              filteredProducts.map((product, index) => renderProductItem(product, index))
            )}
          </ThemedView>
        </ScrollView>
        
        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeFilterModal}
        >
          <TouchableWithoutFeedback onPress={closeFilterModal}>
            <ThemedView style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <ThemedView style={styles.modalContainer}>
                  <ThemedView style={styles.modalHeader}>
                    <TouchableOpacity onPress={navigateBack} disabled={activeLevel === 'main'}>
                      {activeLevel !== 'main' && (
                        <Ionicons 
                          name="arrow-back" 
                          size={24} 
                          color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
                        />
                      )}
                    </TouchableOpacity>
                    <ThemedText style={styles.modalTitle}>
                      {activeLevel === 'main' ? 'Select Category' : 
                       activeLevel === 'sub' ? 'Select Subcategory' : 'Select Sub-subcategory'}
                    </ThemedText>
                    <TouchableOpacity onPress={closeFilterModal}>
                      <Ionicons 
                        name="close" 
                        size={24} 
                        color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
                      />
                    </TouchableOpacity>
                  </ThemedView>
                  
                  {renderBreadcrumb()}
                  
                  <ThemedView style={styles.modalContent}>
                    {renderFilterModalContent()}
                  </ThemedView>
                  
                  <ThemedView style={styles.modalFooter}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]} 
                      onPress={resetFilter}
                    >
                      <ThemedText style={[styles.buttonText, styles.cancelButtonText]}>
                        Reset
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.applyButton]} 
                      onPress={applyFilter}
                    >
                      <ThemedText style={[styles.buttonText, styles.applyButtonText]}>
                        Apply
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              </TouchableWithoutFeedback>
            </ThemedView>
          </TouchableWithoutFeedback>
        </Modal>
        
        {/* Sort Modal */}
        <Modal
          visible={sortModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeSortModal}
        >
          <TouchableWithoutFeedback onPress={closeSortModal}>
            <ThemedView style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <ThemedView style={styles.sortModalContainer}>
                  <ThemedText style={styles.sortModalTitle}>Sort Products</ThemedText>
                  
                  <ThemedView style={styles.modalContent}>
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        sortMethod === 'alphabetical' && styles.selectedSortOption
                      ]}
                      onPress={() => handleSortSelect('alphabetical')}
                    >
                      <ThemedText
                        style={[
                          styles.sortOptionText,
                          sortMethod === 'alphabetical' && styles.selectedSortOptionText
                        ]}
                      >
                        Alphabetical (A-Z)
                      </ThemedText>
                    </TouchableOpacity>
                    
                    {/* Only show price sorting options for non-guest users */}
                    {!isGuest && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortMethod === 'priceLowToHigh' && styles.selectedSortOption
                          ]}
                          onPress={() => handleSortSelect('priceLowToHigh')}
                        >
                          <ThemedText
                            style={[
                              styles.sortOptionText,
                              sortMethod === 'priceLowToHigh' && styles.selectedSortOptionText
                            ]}
                          >
                            Price: Low to High
                          </ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            sortMethod === 'priceHighToLow' && styles.selectedSortOption
                          ]}
                          onPress={() => handleSortSelect('priceHighToLow')}
                        >
                          <ThemedText
                            style={[
                              styles.sortOptionText,
                              sortMethod === 'priceHighToLow' && styles.selectedSortOptionText
                            ]}
                          >
                            Price: High to Low
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {/* Show disabled price options with sign-up prompt for guests */}
                    {isGuest && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            styles.disabledSortOption,
                          ]}
                          onPress={() => router.push('/(auth)/sign-up')}
                        >
                          <ThemedText
                            style={[
                              styles.sortOptionText,
                              styles.disabledSortOptionText,
                            ]}
                          >
                            Price: Low to High (Sign up to access)
                          </ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.sortOption,
                            styles.disabledSortOption,
                          ]}
                          onPress={() => router.push('/(auth)/sign-up')}
                        >
                          <ThemedText
                            style={[
                              styles.sortOptionText,
                              styles.disabledSortOptionText,
                            ]}
                          >
                            Price: High to Low (Sign up to access)
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                  </ThemedView>
                </ThemedView>
              </TouchableWithoutFeedback>
            </ThemedView>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}
