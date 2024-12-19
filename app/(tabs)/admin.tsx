import { useState, useEffect } from 'react';
import { StyleSheet, Platform, ScrollView, Pressable, SafeAreaView, RefreshControl, StatusBar } from 'react-native';
import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usePermissions } from '@/hooks/usePermissions';
import { Product, Category, getAllProducts, getAllCategories, getAllPromotions } from '@/services/firebase';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminProductScreen() {
  const { canManageProducts } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]); // Quick fix
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      padding: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.light.tint,
      padding: 16,
      margin: 16,
      borderRadius: 8,
      gap: 8,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    section: {
      padding: 16,
      gap: 8,
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: Colors.light.secondaryBackground,
      borderRadius: 8,
      marginVertical: 4,
    },
    productText: {
      color: '#000',
      fontWeight: 'medium',
    },
    categoryItem: {
      padding: 16,
      backgroundColor: Colors.light.secondaryBackground,
      borderRadius: 8,
      marginVertical: 4,
    },
    categoryText: {
      color: '#000',
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f5f5f5',
      marginHorizontal: 4,
    },
    categoryName: {
      color: '#FB8A13',
    },
    promotionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: Colors.light.secondaryBackground,
      borderRadius: 8,
      marginVertical: 4,
    },
    promotionText: {
      color: '#000',
      fontWeight: 'medium',
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    getAllCategories();
    getAllProducts();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, promotionsData] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
        getAllPromotions(),
      ]);
      console.log('Loaded promotions:', promotionsData);
      setProducts(productsData);
      setCategories(categoriesData);
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canManageProducts) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>You don't have permission to access this page.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
      <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FB8A13']} // Android
              tintColor="#FB8A13" // iOS
            />
          }
        >
        <ThemedView style={styles.header}>
          <ThemedText type="title">Product Management</ThemedText>
        </ThemedView>

      {/* Add New Product Button */}
      <Pressable style={styles.actionButton} onPress={() => { router.push('/admin/product') }}>
        <IconSymbol name="plus.circle.fill" size={24} color="#FFFFFF" />
        <ThemedText style={styles.buttonText}>Add New Product</ThemedText>
      </Pressable>

      {/* Manage Categories Button */}
      <Pressable style={styles.actionButton} onPress={() => { router.push('/admin/category') }}>
        <IconSymbol name="tag.fill" size={24} color="#FFFFFF" />
        <ThemedText style={styles.buttonText}>Manage Categories</ThemedText>
      </Pressable>

      {/* Add New Promotion Button */}
      <Pressable style={styles.actionButton} onPress={() => { router.push('/admin/promotion') }}>
        <IconSymbol name="sparkles" size={24} color="#FFFFFF" />
        <ThemedText style={styles.buttonText}>Manage Promotions</ThemedText>
      </Pressable>

      {/* Products List */}
      <ThemedView style={styles.section}>
        <Collapsible title={`Products (${products.length})`}>
          {products.map(product => (
            <Pressable 
              key={product.id} 
              style={styles.productItem}
              onPress={() => {
                router.push({
                  pathname: "/admin/product/[id]",
                  params: { id: product.id }
                });
              }}
            >
              <ThemedText style={styles.productText}>{product.name}</ThemedText>
              <IconSymbol name="chevron.right" size={20} color="#808080" />
            </Pressable>
          ))}
        </Collapsible>
      </ThemedView>

      {/* Promotions List */}
      <ThemedView style={styles.section}>
        <Collapsible title={`Promotions (${promotions.length})`}>
          {promotions.map(promotion => (
            <Pressable 
              key={promotion.id} 
              style={styles.promotionItem}
              onPress={() => {
                console.log('Promotion clicked:', promotion.id);
                router.push({
                  pathname: "/admin/promotion/[id]",
                  params: { id: promotion.id }
                });
              }}
            >
              <ThemedText style={styles.promotionText}>
                {promotion.title || promotion.name}
              </ThemedText>
              <IconSymbol name="chevron.right" size={20} color="#808080" />
            </Pressable>
          ))}
        </Collapsible>
      </ThemedView>

      {/* Categories List */}
        <ThemedView style={styles.section}>
          <Collapsible title={`Categories (${categories.length})`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(category => (
                <Pressable
                  key={category.id}
                  style={styles.categoryChip}>
                  <ThemedText style={styles.categoryName}>
                    {category.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Collapsible>
        </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
