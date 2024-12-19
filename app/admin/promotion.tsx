import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, Alert, ScrollView, SafeAreaView, View, Platform, useColorScheme, StatusBar } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Promotion, createPromotion, deletePromotion, getAllPromotions, getAllProducts, Product, uploadImage } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function AdminPromotionsScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',  // Type assertion here
    discountValue: '',
    startDate: new Date(),
    endDate: new Date(),
    minimumPurchase: '',
    active: true,
    productId: '',
    images: [] as ImagePicker.ImagePickerAsset[],
  });

  const { userData } = useAuth();
  const { canManagePromotions } = usePermissions();

  const [discountTypeDropdownOpen, setDiscountTypeDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  const discountTypes = [
    { label: 'Percentage', value: 'percentage' },
    { label: 'Fixed Amount', value: 'fixed' }
  ];

  const colorScheme = useColorScheme();

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
  });

  const loadPromotions = async () => {
    try {
      if (!userData?.role) {
        throw new Error('User role not found');
      }
      const allPromotions = await getAllPromotions();
      setPromotions(allPromotions as Promotion[]);
    } catch (error: any) {
      console.error('Error loading promotions:', error);
      Alert.alert('Error', `Failed to load promotions: ${error.message}`);
      router.replace('/(tabs)');
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error: any) {
      console.error('Error loading products:', error);
      Alert.alert('Error', `Failed to load products: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!canManagePromotions()) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access the promotions page.'
      );
      router.replace('/(tabs)');
      return;
    }
    loadPromotions();
    loadProducts();
  }, [userData]);

  const handleCreatePromotion = async () => {
    try {
      if (!userData) return;

      const uploadPromises = newPromotion.images.map(async (image) => {
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

      await createPromotion({
        ...newPromotion,
        discountValue: parseFloat(newPromotion.discountValue),
        minimumPurchase: parseFloat(newPromotion.minimumPurchase),
        createdBy: userData.uid,
        images: imageUrls,
        startDate: newPromotion.startDate,
        endDate: newPromotion.endDate,
      });

      setNewPromotion({
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        startDate: new Date(),
        endDate: new Date(),
        minimumPurchase: '',
        active: true,
        productId: '',
        images: [],
      });

      loadPromotions();
      Alert.alert('Success', 'Promotion created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 15,
      quality: 1,
    });

    if (!result.canceled) {
      setNewPromotion(prev => ({
        ...prev,
        images: [...prev.images, ...result.assets]
      }));
    }
  };

  const renderImageSection = () => (
    <ThemedView style={styles.imageInputContainer}>
      <ThemedText style={styles.imageInputLabel}>Promotion Images</ThemedText>
      <ScrollView horizontal style={styles.imagePreviewScroll}>
        {newPromotion.images.map((image, index) => (
          <ThemedView key={index} style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: image.uri }}
              style={styles.imagePreview}
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => {
                const newImages = newPromotion.images.filter((_, i) => i !== index);
                setNewPromotion({ ...newPromotion, images: newImages });
              }}>
              <ThemedText style={styles.removeImageButtonText}>✕</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
      </ScrollView>
      {newPromotion.images.length < 15 && (
        <Pressable
          style={styles.addImageButton}
          onPress={pickImage}>
          <ThemedText style={styles.addImageButtonText}>+ Add Images</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );

  const renderDateSection = () => (
    <ThemedView style={styles.dateContainer}>
      <ThemedView style={styles.datePicker}>
        <ThemedText style={styles.inputLabel}>Start Date</ThemedText>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <ThemedText style={styles.dateButtonText}>
            {formatDate(newPromotion.startDate)}
          </ThemedText>
        </Pressable>
        {(showStartDatePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={newPromotion.startDate}
            mode="date"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) setNewPromotion({ ...newPromotion, startDate: date });
            }}
          />
        )}
      </ThemedView>

      <ThemedView style={styles.datePicker}>
        <ThemedText style={styles.inputLabel}>End Date</ThemedText>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <ThemedText style={styles.dateButtonText}>
            {formatDate(newPromotion.endDate)}
          </ThemedText>
        </Pressable>
        {(showEndDatePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={newPromotion.endDate}
            mode="date"
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) setNewPromotion({ ...newPromotion, endDate: date });
            }}
          />
        )}
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Add Promotion</ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedText style={styles.inputLabel}>Promotion Name</ThemedText>
            <TextInput
              style={styles.input}
              value={newPromotion.name}
              onChangeText={(text) => setNewPromotion({ ...newPromotion, name: text })}
            />

            <ThemedText style={styles.inputLabel}>Description</ThemedText>
            <TextInput
              style={styles.multilineInput}
              value={newPromotion.description}
              onChangeText={(text) => setNewPromotion({ ...newPromotion, description: text })}
              multiline={true}
            />

            <ThemedText style={styles.inputLabel}>Discount Type</ThemedText>
            <Pressable
              style={styles.dropdown}
              onPress={() => setDiscountTypeDropdownOpen(!discountTypeDropdownOpen)}
            >
              <ThemedText style={styles.dropdownText}>
                {discountTypes.find(dt => dt.value === newPromotion.discountType)?.label || 'Select discount type'}
              </ThemedText>
            </Pressable>
            {discountTypeDropdownOpen && (
              <ThemedView style={styles.dropdownMenu}>
                {discountTypes.map((type) => (
                  <Pressable
                    key={type.value}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setNewPromotion({ ...newPromotion, discountType: type.value as 'percentage' | 'fixed' });
                      setDiscountTypeDropdownOpen(false);
                    }}
                  >
                    <ThemedText style={styles.dropdownMenuItemText}>
                      {type.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            )}

            <ThemedText style={styles.inputLabel}>Discount Value</ThemedText>
            <TextInput
              style={styles.input}
              value={newPromotion.discountValue}
              onChangeText={(text) => setNewPromotion({ ...newPromotion, discountValue: text })}
              keyboardType="numeric"
            />

            <ThemedText style={styles.inputLabel}>Minimum Purchase</ThemedText>
            <TextInput
              style={styles.input}
              value={newPromotion.minimumPurchase}
              onChangeText={(text) => setNewPromotion({ ...newPromotion, minimumPurchase: text })}
              keyboardType="numeric"
            />

            <ThemedText style={styles.inputLabel}>Select Product</ThemedText>
            <Pressable
              style={styles.dropdown}
              onPress={() => setProductDropdownOpen(!productDropdownOpen)}
            >
              <ThemedText style={styles.dropdownText}>
                {products.find(p => p.id === newPromotion.productId)?.name || 'Select a product'}
              </ThemedText>
            </Pressable>
            {productDropdownOpen && (
              <ThemedView style={styles.dropdownMenu}>
                {products.map((product) => (
                  <Pressable
                    key={product.id}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setNewPromotion({ ...newPromotion, productId: product.id });
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

            <ThemedView style={styles.toggleContainer}>
              <ThemedText style={styles.inputLabel}>Active</ThemedText>
              <Pressable
                style={[
                  styles.toggle,
                  newPromotion.active ? styles.toggleActive : styles.toggleInactive
                ]}
                onPress={() => setNewPromotion(prev => ({ ...prev, active: !prev.active }))}
              >
                <ThemedView style={[
                  styles.toggleHandle,
                  newPromotion.active ? styles.toggleHandleActive : styles.toggleHandleInactive
                ]} />
              </Pressable>
            </ThemedView>
            
            {renderDateSection()}

            {renderImageSection()}

            <Pressable style={styles.button} onPress={handleCreatePromotion}>
              <ThemedText style={styles.buttonText}>Create Promotion</ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
