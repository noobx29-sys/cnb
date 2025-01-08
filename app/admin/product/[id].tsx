import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, Alert, ScrollView, SafeAreaView, Image, useColorScheme, Platform, StatusBar, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Product, updateProduct, uploadImage, getAllCategories, getProductById, deleteProduct } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';

interface Category {
  name: string;
  subCategories?: Subcategory[];
}

interface Subcategory {
  name: string;
  id: string;
  subCategories?: Subcategory[];
}

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const { userData } = useAuth();
  const { canManageProducts } = usePermissions();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [subsubcategoryDropdownOpen, setSubsubcategoryDropdownOpen] = useState(false);
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
      paddingVertical: 12,
    },
    dropdownMenuItemText: {
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
      fontSize: 16,
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
    nestedDropdown: {
      marginLeft: 20,
      borderLeftWidth: 1,
      borderLeftColor: Colors.light.tint,
    },
    nestedItem: {
      fontSize: 14,
      color: Colors.light.textMuted,
    },
  });

  useEffect(() => {
    if (!canManageProducts()) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this page.'
      );
      router.replace('/(tabs)');
      return;
    }
    loadProduct();
    loadCategories();
  }, [id]);

  const loadProduct = async () => {
    try {
      const productData = await getProductById(id as string);
      if (productData) {
        setProduct({
          ...productData,
          images: productData.images || [],
        });
      } else {
        Alert.alert('Error', 'Product not found');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    }
  };

  const loadCategories = async () => {
    try {
      const fetchedCategories = await getAllCategories();
      setCategories(fetchedCategories as unknown as Category[]);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const pickImage = async () => {
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
        setProduct({
          ...product,
          images: [...currentImages, ...newImageUrls]
        });
      } catch (error: any) {
        Alert.alert('Error', 'Failed to upload images');
      }
    }
  };

  const handleUpdateProduct = async () => {
    try {
      if (!product || !userData) return;

      await updateProduct(product.id, {
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory || null,
        subsubcategory: product.subsubcategory || null,
        price: product.price,
        stock: product.stock,
        images: product.images,
      });

      Alert.alert('Success', 'Product updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteProduct = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!product) return;
            try {
              await deleteProduct(product.id);
              Alert.alert('Success', 'Product deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const removeImage = (index: number) => {
    if (!product) return;
    const newImages = [...(product.images || [])];
    newImages.splice(index, 1);
    setProduct({ ...product, images: newImages });
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Edit Product</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedText style={styles.inputLabel}>Name</ThemedText>
          <TextInput
            style={styles.input}
            value={product.name}
            onChangeText={(text) => setProduct({ ...product, name: text })}
          />
          <ThemedText style={styles.inputLabel}>Description</ThemedText>
          <TextInput
            style={styles.multilineInput}
            value={product.description}
            onChangeText={(text) => setProduct({ ...product, description: text })}
            multiline={true}
          />
          <ThemedView style={styles.dropdownContainer}>
            <ThemedText style={styles.dropdownLabel}>Category</ThemedText>
            <Pressable
              style={styles.dropdown}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <ThemedText style={styles.dropdownText}>
                {product.category || 'Select a category'}
              </ThemedText>
            </Pressable>
            {dropdownOpen && (
              <ThemedView style={styles.dropdownMenu}>
                {categories.map((category) => (
                  <Pressable
                    key={category.name}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setProduct({ ...product, category: category.name, subcategory: '' });
                      setDropdownOpen(false);
                    }}
                  >
                    <ThemedText style={styles.dropdownMenuItemText}>
                      {category.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            )}
          </ThemedView>

          {product.category && (categories.find(c => c.name === product.category)?.subCategories ?? []).length > 0 && (
            <ThemedView style={styles.dropdownContainer}>
              <ThemedText style={styles.dropdownLabel}>Subcategory</ThemedText>
              <Pressable
                style={styles.dropdown}
                onPress={() => setSubcategoryDropdownOpen(!subcategoryDropdownOpen)}
              >
                <ThemedText style={styles.dropdownText}>
                  {product.subcategory || 'Select a subcategory'}
                </ThemedText>
              </Pressable>
              {subcategoryDropdownOpen && (
                <ThemedView style={styles.dropdownMenu}>
                  {categories
                    .find(c => c.name === product.category)
                    ?.subCategories
                    ?.map((subcategory: Subcategory) => (
                      <Pressable
                        key={subcategory.id}
                        style={styles.dropdownMenuItem}
                        onPress={() => {
                          setProduct({
                            ...product,
                            subcategory: subcategory.name,
                            subsubcategory: null
                          });
                          setSubcategoryDropdownOpen(false);
                        }}
                      >
                        <ThemedText style={styles.dropdownMenuItemText}>
                          {subcategory.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                </ThemedView>
              )}
            </ThemedView>
          )}
          {product.subcategory && (categories
            .find(c => c.name === product.category)
            ?.subCategories
            ?.find(s => s.name === product.subcategory)
            ?.subCategories ?? []).length > 0 && (
            <ThemedView style={styles.dropdownContainer}>
              <ThemedText style={styles.dropdownLabel}>Sub-subcategory</ThemedText>
              <Pressable
                style={styles.dropdown}
                onPress={() => setSubsubcategoryDropdownOpen(!subsubcategoryDropdownOpen)}
              >
                <ThemedText style={styles.dropdownText}>
                  {product.subsubcategory || 'Select a sub-subcategory'}
                </ThemedText>
              </Pressable>
              {subsubcategoryDropdownOpen && (
                <ThemedView style={styles.dropdownMenu}>
                  {categories
                    .find(c => c.name === product.category)
                    ?.subCategories
                    ?.find(s => s.name === product.subcategory)
                    ?.subCategories
                    ?.map((subsubcategory) => (
                      <Pressable
                        key={subsubcategory.id}
                        style={styles.dropdownMenuItem}
                        onPress={() => {
                          setProduct({
                            ...product,
                            subsubcategory: subsubcategory.name
                          });
                          setSubsubcategoryDropdownOpen(false);
                        }}
                      >
                        <ThemedText style={styles.dropdownMenuItemText}>
                          {subsubcategory.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                </ThemedView>
              )}
            </ThemedView>
          )}
          <ThemedText style={styles.inputLabel}>Price</ThemedText>
          <TextInput
            style={styles.input}
            value={product.price.toString()}
            onChangeText={(text) => setProduct({ ...product, price: parseFloat(text) || 0 })}
            keyboardType="numeric"
          />
          <ThemedText style={styles.inputLabel}>Stock</ThemedText>
          <ThemedView style={styles.stockInputContainer}>
            <Pressable 
              style={styles.stockButton}
              onPress={() => {
                const currentStock = parseInt(product.stock?.toString() || '0');
                setProduct({ ...product, stock: Math.max(0, currentStock - 1) });
              }}
            >
              <ThemedText style={styles.stockButtonText}>-</ThemedText>
            </Pressable>
            <TextInput
              style={styles.stockInput}
              value={product.stock?.toString() || '0'}
              onChangeText={(text) => {
                const filtered = text.replace(/[^0-9]/g, '');
                setProduct({ ...product, stock: parseInt(filtered) || 0 });
              }}
              keyboardType="numeric"
            />
            <Pressable 
              style={styles.stockButton}
              onPress={() => {
                const currentStock = parseInt(product.stock?.toString() || '0');
                setProduct({ ...product, stock: currentStock + 1 });
              }}
            >
              <ThemedText style={styles.stockButtonText}>+</ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.imageSection}>
            <ThemedText style={styles.imageInputLabel}>Product Images</ThemedText>
            <ScrollView horizontal style={styles.imagePreviewScroll}>
              {product.images?.map((imageUrl, index) => (
                <ThemedView key={index} style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.imagePreview}
                  />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}>
                    <ThemedText style={styles.removeImageButtonText}>✕</ThemedText>
                  </Pressable>
                </ThemedView>
              ))}
            </ScrollView>
            {(!product.images || product.images.length < 15) && (
              <Pressable
                style={styles.addImageButton}
                onPress={pickImage}>
                <ThemedText style={styles.addImageButtonText}>+ Add Images</ThemedText>
              </Pressable>
            )}
          </ThemedView>

          <ThemedView style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={handleUpdateProduct}>
              <ThemedText style={styles.buttonText}>Update Product</ThemedText>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={handleDeleteProduct}>
              <ThemedText style={styles.buttonText}>Delete Product</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
} 