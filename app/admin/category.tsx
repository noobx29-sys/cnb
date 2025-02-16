import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, Alert, SafeAreaView, useColorScheme, Platform, StatusBar, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Category as FirebaseCategory, createCategory, deleteCategory, getAllCategories, deleteSubcategory, updateCategory } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Colors } from '@/constants/Colors';

interface SubCategory {
  id: string;
  name: string;
  subCategories?: SubCategory[];
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
  createdAt: Date;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.secondaryBackground,
    borderRadius: 8,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subcategoryItem: {
    marginLeft: 20,
    backgroundColor: Colors.light.background,
    borderLeftWidth: 2,
    borderLeftColor: Colors.light.tint,
    opacity: 0.9,
  },
  subsubcategoryItem: {
    marginLeft: 40,
    backgroundColor: Colors.light.background,
    borderLeftWidth: 2,
    borderLeftColor: Colors.light.tint,
    opacity: 0.8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  subcategoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  subsubcategoryName: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  expandButton: {
    padding: 8,
    marginRight: 8,
  },
  expandButtonText: {
    fontSize: 18,
    color: Colors.light.tint,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSubcategoryButton: {
    backgroundColor: Colors.light.tint,
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: Colors.light.error,
    padding: 8,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 8,
  },
  categoriesList: {
    flex: 1,
    width: '100%',
    paddingBottom: 20,
  },
});

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const { userData } = useAuth();
  const { canManageProducts } = usePermissions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await getAllCategories();
      console.log('Fetched categories:', fetchedCategories); // Let's keep this debug log
      // Ensure each category has a subCategories array
      const categoriesWithSub = fetchedCategories.map(cat => ({
        ...cat,
        subCategories: cat.subCategories || []
      }));
      setCategories(categoriesWithSub);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const handleCreateCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        Alert.alert('Error', 'Category name cannot be empty');
        return;
      }

      if (selectedParentId) {
        // Find if this is a main category or subcategory
        const mainCategory = categories.find(cat => cat.id === selectedParentId);
        if (mainCategory) {
          // Adding to main category
          const newSubCategory = {
            id: Date.now().toString(),
            name: newCategoryName.trim(),
            subCategories: []
          };
          
          await updateCategory(selectedParentId, {
            subCategories: [...(mainCategory.subCategories || []), newSubCategory]
          });
        } else {
          // Find the parent category and subcategory
          for (const category of categories) {
            const parentSubCategory = category.subCategories?.find(sub => sub.id === selectedParentId);
            if (parentSubCategory) {
              const newSubSubCategory = {
                id: Date.now().toString(),
                name: newCategoryName.trim()
              };

              const updatedSubCategories = category.subCategories.map(sub => {
                if (sub.id === selectedParentId) {
                  return {
                    ...sub,
                    subCategories: [...(sub.subCategories || []), newSubSubCategory]
                  };
                }
                return sub;
              });

              await updateCategory(category.id, {
                subCategories: updatedSubCategories
              });
              break;
            }
          }
        }
      } else {
        // Create main category
        await createCategory(newCategoryName.trim());
      }

      setNewCategoryName('');
      setSelectedParentId(null);
      loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        // First check if it's a direct subcategory
        const isDirectSubcategory = category.subCategories.some(sub => sub.id === subcategoryId);
        
        if (isDirectSubcategory) {
          // Handle direct subcategory deletion
          const updatedSubCategories = category.subCategories.filter(
            sub => sub.id !== subcategoryId
          );
          await updateCategory(categoryId, { subCategories: updatedSubCategories });
        } else {
          // Handle sub-subcategory deletion
          const updatedSubCategories = category.subCategories.map(sub => {
            if (sub.subCategories?.some(subsub => subsub.id === subcategoryId)) {
              return {
                ...sub,
                subCategories: sub.subCategories.filter(subsub => subsub.id !== subcategoryId)
              };
            }
            return sub;
          });
          await updateCategory(categoryId, { subCategories: updatedSubCategories });
        }
        loadCategories();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderCategories = () => {
    const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

    const toggleExpand = (id: string) => {
      setExpandedCategories(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    };

    return categories.map(category => {
      const hasSubCategories = category.subCategories?.length > 0;
      const isExpanded = expandedCategories[category.id];

      return (
        <View key={category.id}>
          <ThemedView style={styles.categoryItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {hasSubCategories && (
                <Pressable
                  style={styles.expandButton}
                  onPress={() => toggleExpand(category.id)}>
                  <ThemedText style={styles.expandButtonText}>
                    {isExpanded ? '−' : '+'}
                  </ThemedText>
                </Pressable>
              )}
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            </View>
            <View style={styles.categoryActions}>
              <Pressable
                style={styles.addSubcategoryButton}
                onPress={() => setSelectedParentId(category.id)}>
                <ThemedText style={styles.actionButtonText}>Add Sub</ThemedText>
              </Pressable>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteCategory(category.id)}>
                <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
              </Pressable>
            </View>
          </ThemedView>

          {isExpanded && Array.isArray(category.subCategories) && category.subCategories.map(subCategory => {
            const hasSubSubCategories = subCategory.subCategories && subCategory.subCategories?.length > 0;
            const isSubExpanded = expandedCategories[subCategory.id];

            return (
              <View key={subCategory.id}>
                <ThemedView style={[styles.categoryItem, styles.subcategoryItem]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {hasSubSubCategories && (
                      <Pressable
                        style={styles.expandButton}
                        onPress={() => toggleExpand(subCategory.id)}>
                        <ThemedText style={styles.expandButtonText}>
                          {isSubExpanded ? '−' : '+'}
                        </ThemedText>
                      </Pressable>
                    )}
                    <ThemedText style={[styles.categoryName, styles.subcategoryName]}>
                      {subCategory.name}
                    </ThemedText>
                  </View>
                  <View style={styles.categoryActions}>
                    <Pressable
                      style={styles.addSubcategoryButton}
                      onPress={() => setSelectedParentId(subCategory.id)}>
                      <ThemedText style={styles.actionButtonText}>Add Sub</ThemedText>
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSubcategory(category.id, subCategory.id)}>
                      <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
                    </Pressable>
                  </View>
                </ThemedView>

                {isSubExpanded && Array.isArray(subCategory.subCategories) && 
                  subCategory.subCategories.map(subSubCategory => (
                    <View key={subSubCategory.id}>
                      <ThemedView style={[styles.categoryItem, styles.subsubcategoryItem]}>
                        <ThemedText style={[styles.categoryName, styles.subsubcategoryName]}>
                          {subSubCategory.name}
                        </ThemedText>
                        <View style={styles.categoryActions}>
                          <Pressable
                            style={styles.deleteButton}
                            onPress={() => handleDeleteSubcategory(category.id, subSubCategory.id)}>
                            <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
                          </Pressable>
                        </View>
                      </ThemedView>
                    </View>
                ))}
              </View>
            );
          })}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              placeholderTextColor="#666"
            />
            <Pressable
              style={styles.button}
              onPress={handleCreateCategory}>
              <ThemedText style={styles.buttonText}>
                {selectedParentId ? 'Add Subcategory' : 'Add Category'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.categoriesList}>
            {renderCategories()}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}