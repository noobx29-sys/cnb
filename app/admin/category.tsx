import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, Alert, SafeAreaView, useColorScheme, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Category, createCategory, deleteCategory, getAllCategories } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { userData } = useAuth();
  const { canManageProducts } = usePermissions();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    if (!canManageProducts()) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this page.'
      );
      router.replace('/(tabs)');
      return;
    }
    loadCategories();
  }, [userData]);

  const handleCreateCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        Alert.alert('Error', 'Category name cannot be empty');
        return;
      }

      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      loadCategories();
      Alert.alert('Success', 'Category created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      loadCategories();
      Alert.alert('Success', 'Category deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getColors = () => ({
    text: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    background: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    tint: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    border: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
  });

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
    form: {
      gap: 16,
      padding: 16,
      marginBottom: 32,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    },
    button: {
      height: 48,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    categoriesList: {
      gap: 12,
      padding: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: Colors.light.background,
      borderRadius: 8,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.light.text,
    },
    deleteButton: {
      backgroundColor: '#ff4444',
      padding: 8,
      borderRadius: 6,
    },
    deleteButtonText: {
      color: '#fff',
    },
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Manage Categories</ThemedText>
      </ThemedView>

      <ThemedView style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Category Name"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          placeholderTextColor="#666"
        />
        <Pressable style={styles.button} onPress={handleCreateCategory}>
          <ThemedText style={styles.buttonText}>Add Category</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.categoriesList}>
        {categories.map((category) => (
          <ThemedView key={category.id} style={styles.categoryItem}>
            <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDeleteCategory(category.id)}>
              <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}