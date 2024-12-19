import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, Alert, ScrollView, SafeAreaView, Image, useColorScheme, StatusBar, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Product, createProduct, deleteProduct, getAllProducts, uploadImage, getAllCategories } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    images: [] as ImagePicker.ImagePickerAsset[],
  });
  const [categories, setCategories] = useState<string[]>([]);
  const { userData } = useAuth();
  const { canManageProducts } = usePermissions();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    header: {
      padding: 20,
    },
    form: {
      gap: 16,
      padding: 20,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
      backgroundColor: colorScheme === 'dark' ? Colors.light.background : Colors.dark.background,
    },
    multilineInput: {
      height: 'auto',  
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
      backgroundColor: colorScheme === 'dark' ? Colors.light.background : Colors.dark.background,
      minHeight: 100,     
      paddingVertical: 12,  
    },
    inputLabel: {
      color: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
      fontWeight: '600',
    },
    imageSection: {
      gap: 8,
    },
    imageInputLabel: {
      color: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
      fontWeight: '600',
    },
    imageInputContainer: {
      gap: 8,
    },
    imagePreviewScroll: {
      flexGrow: 0,
      height: 120,
    },
    imagePreviewContainer: {
      marginTop: 8,
      marginRight: 8,
      position: 'relative',
    },
    imagePreview: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: '#ff4444',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeImageButtonText: {
      color: '#fff',
      fontSize: 12,
    },
    addImageButton: {
      padding: 12,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
      borderRadius: 8,
      alignItems: 'center',
    },
    addImageButtonText: {
      color: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    },
    button: {
      height: 48,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    dropdownContainer: {
      gap: 8,
    },
    dropdownLabel: {
      color: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
    },
    dropdown: {
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colorScheme === 'dark' ? Colors.light.background : Colors.dark.background,
    },
    dropdownText: {
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
    },
    dropdownMenu: {
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      borderRadius: 8,
      padding: 8,
      gap: 8,
      backgroundColor: colorScheme === 'dark' ? Colors.light.background : Colors.dark.background,
    },
    dropdownMenuItem: {
      padding: 8,
    },
    dropdownMenuItemText: {
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
    },
    buttonContainer: {
      gap: 16,
      marginTop: 16,
    },
    deleteButton: {
      height: 48,
      backgroundColor: '#ff4444',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stockInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stockInput: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
      backgroundColor: colorScheme === 'dark' ? Colors.light.background : Colors.dark.background,
      textAlign: 'center',
    },
    stockButton: {
      width: 48,
      height: 48,
      backgroundColor: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stockButtonText: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '600',
    },
  });

  useEffect(() => {
    getAllCategories();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('Attempting to load products with user:', userData);  // Debug log
      if (!userData?.role) {
        throw new Error('User role not found');
      }
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error: any) {
      console.error('Detailed error:', error);  // Debug log
      Alert.alert(
        'Permission Error',
        `Error: ${error.message}`
      );
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    if (!canManageProducts()) {
      console.log('canManageProducts check failed');  // Debug log
      Alert.alert(
        'Access Denied',
        'You do not have permission to access the admin products page.'
      );
      router.replace('/(tabs)');
      return;
    }
    loadProducts();
  }, [userData]); // Add userData as dependency

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        console.log('Fetched categories:', fetchedCategories);
        setCategories(fetchedCategories.map(category => category.name));
      } catch (error) {
        console.error('Error loading categories:', error);
        Alert.alert('Error', 'Failed to load categories');
      }
    };
    
    loadCategories();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 15,
      quality: 1,
    });

    if (!result.canceled) {
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...result.assets]
      }));
    }
  };

  const handleCreateProduct = async () => {
    try {
      if (!userData) return;

      const uploadPromises = newProduct.images.map(async (image) => {
        try {
          const imageUrl = await uploadImage(image.uri);
          if (!imageUrl) throw new Error('Failed to upload image');
          return imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      });

      const imageUrls = await Promise.all(uploadPromises);

      await createProduct({
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        images: imageUrls,
        createdBy: userData.uid,
      });

      setNewProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        images: [],
      });

      loadProducts();
      Alert.alert('Success', 'Product created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      loadProducts();
      Alert.alert('Success', 'Product deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderImageSection = () => (
    <ThemedView style={styles.imageInputContainer}>
      <ThemedText style={styles.imageInputLabel}>Product Images</ThemedText>
      <ScrollView horizontal style={styles.imagePreviewScroll}>
        {newProduct.images.map((image, index) => (
          <ThemedView key={index} style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: image.uri }}
              style={styles.imagePreview}
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => {
                const newImages = newProduct.images.filter((_, i) => i !== index);
                setNewProduct({ ...newProduct, images: newImages });
              }}>
              <ThemedText style={styles.removeImageButtonText}>✕</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
      </ScrollView>
      {newProduct.images.length < 15 && (
        <Pressable
          style={styles.addImageButton}
          onPress={pickImage}>
          <ThemedText style={styles.addImageButtonText}>+ Add Images</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );

  const getColors = () => ({
    text: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    background: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    tint: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    border: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
  });

  return (
    <ThemedView style={styles.container}>
    <SafeAreaView style={styles.safeArea}>
        <ScrollView>
            <ThemedView style={styles.header}>
                <ThemedText type="title">Add Product</ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
                <ThemedText style={styles.inputLabel}>Name</ThemedText>
                <TextInput
                style={styles.input}
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                />
                <ThemedText style={styles.inputLabel}>Description</ThemedText>
                <TextInput
                style={styles.multilineInput}
                value={newProduct.description}
                onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                multiline={true}
                />
                <ThemedView style={styles.dropdownContainer}>
                <ThemedText style={styles.dropdownLabel}>Category</ThemedText>
                <Pressable
                    style={styles.dropdown}
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                    <ThemedText style={styles.dropdownText}>
                    {newProduct.category || 'Select a category'}
                    </ThemedText>
                </Pressable>
                {dropdownOpen && (
                    <ThemedView style={styles.dropdownMenu}>
                    {categories.map((category) => (
                        <Pressable
                        key={category}
                        style={styles.dropdownMenuItem}
                        onPress={() => {
                            setNewProduct({ ...newProduct, category });
                            setDropdownOpen(false);
                        }}
                        >
                        <ThemedText style={styles.dropdownMenuItemText}>
                            {category}
                        </ThemedText>
                        </Pressable>
                    ))}
                    </ThemedView>
                )}
                </ThemedView>
                <ThemedText style={styles.inputLabel}>Price</ThemedText>
                <TextInput
                style={styles.input}
                value={newProduct.price}
                onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                keyboardType="numeric"
                />
                <ThemedText style={styles.inputLabel}>Stock</ThemedText>
                <ThemedView style={styles.stockInputContainer}>
                  <Pressable 
                    style={styles.stockButton}
                    onPress={() => {
                      const currentStock = parseInt(newProduct.stock) || 0;
                      setNewProduct({ ...newProduct, stock: Math.max(0, currentStock - 1).toString() });
                    }}
                  >
                    <ThemedText style={styles.stockButtonText}>-</ThemedText>
                  </Pressable>
                  <TextInput
                    style={styles.stockInput}
                    value={newProduct.stock}
                    onChangeText={(text) => {
                      // Only allow positive numbers
                      const filtered = text.replace(/[^0-9]/g, '');
                      setNewProduct({ ...newProduct, stock: filtered });
                    }}
                    keyboardType="numeric"
                  />
                  <Pressable 
                    style={styles.stockButton}
                    onPress={() => {
                      const currentStock = parseInt(newProduct.stock) || 0;
                      setNewProduct({ ...newProduct, stock: (currentStock + 1).toString() });
                    }}
                  >
                    <ThemedText style={styles.stockButtonText}>+</ThemedText>
                  </Pressable>
                </ThemedView>
                {renderImageSection()}
                <Pressable style={styles.button} onPress={handleCreateProduct}>
                <ThemedText style={styles.buttonText}>Add Product</ThemedText>
                </Pressable>
            </ThemedView>
        </ScrollView>
    </SafeAreaView>
    </ThemedView>
  );
}