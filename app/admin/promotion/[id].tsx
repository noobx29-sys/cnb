import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, Alert, ScrollView, SafeAreaView, Image, useColorScheme, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { updatePromotion, deletePromotion, getAllProducts, getAllPromotions } from '@/services/database';
import { uploadImageToCloudinary } from '@/services/cloudinary';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  categoryId: string | null;
  category: string | null;
  subcategory: string | null;
  subsubcategory: string | null;
  imageUrl: string | null;
  images: string[] | null;
  inStock: boolean;
  stockQuantity: number | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Promotion {
  id?: string;
  title: string;
  name?: string; // For backward compatibility
  description: string | null;
  discountPercentage: string | null;
  discountAmount: string | null;
  discountType?: string; // For backward compatibility
  discountValue?: number; // For backward compatibility
  minimumPurchase?: number; // For backward compatibility
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  active?: boolean; // For backward compatibility
  imageUrl: string | null;
  images?: string[]; // For backward compatibility
  productIds: string[] | null;
  productId?: string; // For backward compatibility
  createdBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Upload image using Cloudinary
const uploadImage = async (uri: string, path?: string): Promise<string> => {
  try {
    return await uploadImageToCloudinary(uri, path || 'promotions');
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Helper function to get promotion by ID
const getPromotionById = async (id: string): Promise<Promotion | null> => {
  try {
    const promotions = await getAllPromotions();
    return promotions.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error getting promotion by ID:', error);
    return null;
  }
};

export default function EditPromotionScreen() {
  const { id } = useLocalSearchParams();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { userData } = useAuth();
  const { canManagePromotions } = usePermissions();
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [discountTypeDropdownOpen, setDiscountTypeDropdownOpen] = useState(false);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!canManagePromotions()) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this page.'
      );
      router.replace('/(tabs)');
      return;
    }
    loadPromotion();
    loadProducts();
  }, [id]);

  const loadPromotion = async () => {
    try {
      const promotionData = await getPromotionById(id as string);
      if (promotionData) {
        // Map database fields to component state with backward compatibility
        setPromotion({
          ...promotionData,
          name: promotionData.title, // Map title to name for backward compatibility
          images: promotionData.imageUrl ? [promotionData.imageUrl] : [],
          discountType: promotionData.discountPercentage ? 'percentage' : 'fixed',
          discountValue: parseFloat(promotionData.discountPercentage || promotionData.discountAmount || '0'),
          minimumPurchase: 0, // Default value since it's not in current schema
          startDate: new Date(promotionData.startDate),
          endDate: new Date(promotionData.endDate),
          productId: promotionData.productIds?.[0] || '',
          active: promotionData.isActive,
        });
      } else {
        Alert.alert('Error', 'Promotion not found');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const fetchedProducts = await getAllProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 15,
      quality: 1,
    });

    if (!result.canceled && promotion) {
      const currentImages = promotion.images || [];
      if (currentImages.length + result.assets.length > 15) {
        Alert.alert('Error', 'Maximum 15 images allowed');
        return;
      }

      const uploadPromises = result.assets.map(async (image, index) => {
        try {
          const imageUrl = await uploadImage(image.uri, `promotions/${id}_${Date.now()}_${index}`);
          return imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      });

      try {
        const newImageUrls = await Promise.all(uploadPromises);
        setPromotion({
          ...promotion,
          images: [...currentImages, ...newImageUrls]
        });
      } catch (error: any) {
        Alert.alert('Error', 'Failed to upload images');
      }
    }
  };

  const handleUpdatePromotion = async () => {
    try {
      if (!promotion || !userData) return;

      await updatePromotion(promotion.id!, {
        title: promotion.name || promotion.title,
        description: promotion.description,
        discountPercentage: promotion.discountType === 'percentage' ? promotion.discountValue?.toString() || null : null,
        discountAmount: promotion.discountType === 'fixed' ? promotion.discountValue?.toString() || null : null,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.active ?? promotion.isActive,
        productIds: promotion.productId ? [promotion.productId] : null,
        imageUrl: promotion.images?.[0] || null,
      });

      Alert.alert('Success', 'Promotion updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeletePromotion = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this promotion?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!promotion || !promotion.id) return;
            try {
              await deletePromotion(promotion.id);
              Alert.alert('Success', 'Promotion deleted successfully');
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
    if (!promotion) return;
    const newImages = [...(promotion.images || [])];
    newImages.splice(index, 1);
    setPromotion({ ...promotion, images: newImages });
  };

  const getColors = () => ({
    text: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    background: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    tint: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    border: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
  });

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
      color: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
      fontWeight: '600',
    },
    imageSection: {
      gap: 8,
    },
    imageInputLabel: {
      color: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
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
      borderColor: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
      borderRadius: 8,
      alignItems: 'center',
    },
    addImageButtonText: {
      color: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
    },
    button: {
      height: 48,
      backgroundColor: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
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
      fontWeight: '600',
    },
    dropdown: {
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      backgroundColor: colorScheme === 'dark' ? Colors.light.background : Colors.dark.background,
      borderRadius: 8,
      padding: 12,
    },
    dropdownText: {
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
    },
    dropdownMenu: {
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
      backgroundColor: colorScheme === 'dark' ? Colors.light.background : Colors.dark.background,
      borderRadius: 8,
      padding: 8,
      gap: 8,
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
    dateContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    datePicker: {
      flex: 1,
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggle: {
      width: 51,
      height: 31,
      borderRadius: 15.5,
      padding: 2,
    },
    toggleActive: {
      backgroundColor: colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint,
    },
    toggleInactive: {
      backgroundColor: colorScheme === 'dark' ? Colors.light.border : Colors.dark.border,
    },
    toggleHandle: {
      width: 27,
      height: 27,
      borderRadius: 13.5,
      backgroundColor: 'white',
    },
    toggleHandleActive: {
      transform: [{ translateX: 20 }],
    },
    toggleHandleInactive: {
      transform: [{ translateX: 0 }],
    },
    dateButton: {
      padding: 12,
    },
    dateButtonText: {
      color: colorScheme === 'dark' ? Colors.light.text : Colors.dark.text,
    },
    loadingIndicator: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (!promotion) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FB8A13" style={styles.loadingIndicator} />
      </SafeAreaView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Edit Promotion</ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedText style={styles.inputLabel}>Name</ThemedText>
            <TextInput
              style={styles.input}
              value={promotion.name}
              onChangeText={(text) => setPromotion({ ...promotion, name: text })}
            />

            <ThemedText style={styles.inputLabel}>Description</ThemedText>
            <TextInput
              style={styles.multilineInput}
              value={promotion.description || ''}
              onChangeText={(text) => setPromotion({ ...promotion, description: text })}
              multiline={true}
            />

            <ThemedView style={styles.dropdownContainer}>
              <ThemedText style={styles.dropdownLabel}>Discount Type</ThemedText>
              <Pressable
                style={styles.dropdown}
                onPress={() => setDiscountTypeDropdownOpen(!discountTypeDropdownOpen)}
              >
                <ThemedText style={styles.dropdownText}>
                  {promotion.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </ThemedText>
              </Pressable>
              {discountTypeDropdownOpen && (
                <ThemedView style={styles.dropdownMenu}>
                  <Pressable
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setPromotion({ ...promotion, discountType: 'percentage' });
                      setDiscountTypeDropdownOpen(false);
                    }}
                  >
                    <ThemedText style={styles.dropdownMenuItemText}>Percentage</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setPromotion({ ...promotion, discountType: 'fixed' });
                      setDiscountTypeDropdownOpen(false);
                    }}
                  >
                    <ThemedText style={styles.dropdownMenuItemText}>Fixed Amount</ThemedText>
                  </Pressable>
                </ThemedView>
              )}
            </ThemedView>

            <ThemedText style={styles.inputLabel}>Discount Value</ThemedText>
            <TextInput
              style={styles.input}
              value={(promotion.discountValue || 0).toString()}
              onChangeText={(text) => setPromotion({ ...promotion, discountValue: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />

            <ThemedText style={styles.inputLabel}>Minimum Purchase</ThemedText>
            <TextInput
              style={styles.input}
              value={(promotion.minimumPurchase || 0).toString()}
              onChangeText={(text) => setPromotion({ ...promotion, minimumPurchase: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />

            <ThemedView style={styles.dropdownContainer}>
              <ThemedText style={styles.dropdownLabel}>Select Product</ThemedText>
              <Pressable
                style={styles.dropdown}
                onPress={() => setProductDropdownOpen(!productDropdownOpen)}
              >
                <ThemedText style={styles.dropdownText}>
                  {products.find(p => p.id === promotion.productId)?.name || 'Select a product (optional)'}
                </ThemedText>
              </Pressable>
              {productDropdownOpen && (
                <ThemedView style={styles.dropdownMenu}>
                  <Pressable
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setPromotion({ ...promotion, productId: '' });
                      setProductDropdownOpen(false);
                    }}
                  >
                    <ThemedText style={styles.dropdownMenuItemText}>
                      None (applies to all products)
                    </ThemedText>
                  </Pressable>
                  {products.map((product) => (
                    <Pressable
                      key={product.id}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setPromotion({ ...promotion, productId: product.id });
                        setProductDropdownOpen(false);
                      }}
                    >
                      <ThemedText style={styles.dropdownMenuItemText}>
                        {product.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView style={styles.toggleContainer}>
              <ThemedText style={styles.inputLabel}>Active</ThemedText>
              <Pressable
                style={[
                  styles.toggle,
                  promotion?.active ? styles.toggleActive : styles.toggleInactive
                ]}
                onPress={() => setPromotion(prev => prev ? { ...prev, active: !prev.active } : prev)}
              >
                <ThemedView style={[
                  styles.toggleHandle,
                  promotion?.active ? styles.toggleHandleActive : styles.toggleHandleInactive
                ]} />
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.dateContainer}>
              <ThemedView style={styles.datePicker}>
                <ThemedText style={styles.inputLabel}>Start Date</ThemedText>
                <DateTimePicker
                  value={promotion.startDate}
                  mode="date"
                  onChange={(event, date) => {
                    if (date) setPromotion({ ...promotion, startDate: date });
                  }}
                />
              </ThemedView>
              <ThemedView style={styles.datePicker}>
                <ThemedText style={styles.inputLabel}>End Date</ThemedText>
                <DateTimePicker
                  value={promotion.endDate}
                  mode="date"
                  onChange={(event, date) => {
                    if (date) setPromotion({ ...promotion, endDate: date });
                  }}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.imageSection}>
              <ThemedText style={styles.imageInputLabel}>Promotion Images</ThemedText>
              <ScrollView horizontal style={styles.imagePreviewScroll}>
                {promotion.images?.map((imageUrl, index) => (
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
              {(!promotion.images || promotion.images.length < 15) && (
                <Pressable
                  style={styles.addImageButton}
                  onPress={pickImage}>
                  <ThemedText style={styles.addImageButtonText}>+ Add Images</ThemedText>
                </Pressable>
              )}
            </ThemedView>

            <ThemedView style={styles.buttonContainer}>
              <Pressable style={styles.button} onPress={handleUpdatePromotion}>
                <ThemedText style={styles.buttonText}>Update Promotion</ThemedText>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={handleDeletePromotion}>
                <ThemedText style={styles.buttonText}>Delete Promotion</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
