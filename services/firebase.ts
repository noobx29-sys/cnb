import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, deleteDoc, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import firebaseConfig from '@/firebaseConfig';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
let auth: ReturnType<typeof getAuth>;
try {
  // Check if auth is already initialized
  auth = getAuth(app);
  // If auth exists but wasn't initialized with persistence, reinitialize it
  if (!auth.currentUser?.metadata?.lastSignInTime) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error) {
  console.log('Auth initialization error:', error);
  // If initialization fails, try getting existing auth instance
  auth = getAuth(app);
}

// Export initialized auth
export { auth };

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app, "gs://cnb-app-f2ed6.firebasestorage.app");

// User types
export interface UserData {
  uid: string;
  email: string;
  name: string;
  companyName?: string;
  fullName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt?: Date;
  isGuest?: boolean;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string | null;
  subcategory: string | null;
  subsubcategory: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Category types
export interface Category {
  id: string;
  name: string;
  subCategories: Array<{
    id: string;
    name: string;
    order?: number;
    subCategories?: Array<{
      id: string;
      name: string;
      order?: number;
      subCategories?: Array<{
        id: string;
        name: string;
        order?: number;
      }>;
    }>;
  }>;
  createdAt: Date;
  order?: number;
}

// Promotion types
export interface Promotion {
  id?: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  minimumPurchase: number;
  active: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  images?: string[];
  productId: string;
}

// User roles
export type UserRole = 'Admin' | 'Manager' | 'User - Price' | 'User - No Price' | 'Pending' | 'Guest';

// Update or add this interface
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  // ... other user fields ...
}

// Firebase collections
export const usersCollection = collection(db, 'users');
export const productsCollection = collection(db, 'products');
export const categoriesCollection = collection(db, 'categories');

// User functions
export async function createUserDocument(userData: Omit<UserData, 'createdAt' | 'updatedAt'>) {
  const userDoc = doc(usersCollection, userData.uid);
  const timestamp = new Date();
  
  await setDoc(userDoc, {
    ...userData,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function getUserDocument(uid: string) {
  const userDoc = doc(usersCollection, uid);
  const userSnapshot = await getDoc(userDoc);
  
  if (userSnapshot.exists()) {
    return userSnapshot.data() as UserData;
  }
  return null;
} 

// Find user by email
export async function getUserByEmail(email: string) {
  const q = query(usersCollection, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as UserData;
  }
  return null;
}

// Find user by username/name
export async function getUserByName(name: string) {
  const q = query(usersCollection, where('name', '==', name));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as UserData;
  }
  return null;
}

// Product functions
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const productRef = doc(productsCollection);
    const timestamp = new Date();
    
    if (auth && auth.currentUser) {
      console.log('Current user:', auth.currentUser.uid);
    } else {
      console.log('No current user found');
    }
    console.log('Attempting to create product as admin');

    await setDoc(productRef, {
      id: productRef.id,
      ...productData,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    console.log('Product created successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating product:', error.message);
      if ((error as any).code === 'permission-denied') {
        console.error('Permission denied. Check if user has admin role.');
      }
    } else {
      console.error('Unknown error creating product:', error);
    }
    throw error;
  }
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
  const productRef = doc(productsCollection, productId);
  const timestamp = new Date();
  
  await setDoc(productRef, {
    ...productData,
    updatedAt: timestamp,
  }, { merge: true });
}

export async function deleteProduct(productId: string) {
  const productRef = doc(productsCollection, productId);
  await deleteDoc(productRef);
}

export async function getProductsByCategory(category: string) {
  const q = query(productsCollection, where('category', '==', category));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as Product);
}

export async function getAllProducts() {
  const querySnapshot = await getDocs(productsCollection);
  return querySnapshot.docs.map(doc => doc.data() as Product);
}

// Category functions
export const createCategory = async (name: string, parentCategoryId?: string, parentSubcategoryId?: string, order?: number) => {
  try {
    if (!parentCategoryId) {
      // Creating main category
      const newCategory = {
        name,
        subCategories: [],
        createdAt: new Date(),
        order: order !== undefined ? order : 0,
      };
      const docRef = await addDoc(collection(db, 'categories'), newCategory);
      return docRef.id;
    }

    const categoryRef = doc(db, 'categories', parentCategoryId);
    const categorySnap = await getDoc(categoryRef);
    const category = categorySnap.data() as Category;

    if (!parentSubcategoryId) {
      // Adding first level subcategory
      const newSubCategory = {
        id: Date.now().toString(),
        name,
        subCategories: [],
        order: order !== undefined ? order : category.subCategories.length,
      };
      await updateDoc(categoryRef, {
        subCategories: arrayUnion(newSubCategory)
      });
      return newSubCategory.id;
    }

    // Find the parent subcategory
    const updatedSubCategories = category.subCategories.map(subCat => {
      if (subCat.id === parentSubcategoryId) {
        const subSubCategories = subCat.subCategories || [];
        return {
          ...subCat,
          subCategories: [
            ...subSubCategories,
            {
              id: Date.now().toString(),
              name,
              subCategories: [],
              order: order !== undefined ? order : subSubCategories.length,
            }
          ]
        };
      }
      return subCat;
    });

    await updateDoc(categoryRef, {
      subCategories: updatedSubCategories
    });
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: string, data: Partial<Category>) => {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, data);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string) => {
  try {
    const productsSnapshot = await getDocs(
      query(collection(db, 'products'), where('category', '==', categoryId))
    );
    
    const batch = writeBatch(db);
    productsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { 
        category: null,
        subcategory: null 
      });
    });
    
    batch.delete(doc(db, 'categories', categoryId));
    await batch.commit();
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const deleteSubcategory = async (
  categoryId: string, 
  subcategoryId: string, 
  parentSubcategoryId?: string,
  grandparentSubcategoryId?: string
) => {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    const categorySnap = await getDoc(categoryRef);
    const category = categorySnap.data() as Category;

    let updatedSubCategories;

    if (!parentSubcategoryId) {
      // Delete first level subcategory
      updatedSubCategories = category.subCategories.filter(
        sub => sub.id !== subcategoryId
      );
    } else if (!grandparentSubcategoryId) {
      // Delete second level subcategory
      updatedSubCategories = category.subCategories.map(subCat => {
        if (subCat.id === parentSubcategoryId) {
          return {
            ...subCat,
            subCategories: (subCat.subCategories || []).filter(
              sub => sub.id !== subcategoryId
            )
          };
        }
        return subCat;
      });
    } else {
      // Delete third level subcategory
      updatedSubCategories = category.subCategories.map(subCat => {
        if (subCat.id === grandparentSubcategoryId) {
          return {
            ...subCat,
            subCategories: (subCat.subCategories || []).map(secondLevelSub => {
              if (secondLevelSub.id === parentSubcategoryId) {
                return {
                  ...secondLevelSub,
                  subCategories: (secondLevelSub.subCategories || []).filter(
                    thirdLevelSub => thirdLevelSub.id !== subcategoryId
                  )
                };
              }
              return secondLevelSub;
            })
          };
        }
        return subCat;
      });
    }

    // Update products that use this subcategory
    const productsSnapshot = await getDocs(
      query(collection(db, 'products'), where('subsubcategory', '==', subcategoryId))
    );

    const batch = writeBatch(db);
    productsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { 
        subsubcategory: null 
      });
    });

    // Update the category
    batch.update(categoryRef, { subCategories: updatedSubCategories });
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    throw error;
  }
};

export const getAllCategories = async () => {
  try {
    const categoriesRef = collection(db, 'categories');
    const querySnapshot = await getDocs(categoriesRef);
    const categories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Raw category data:', data);
      return {
        id: doc.id,
        name: data.name,
        subCategories: data.subCategories || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        order: data.order !== undefined ? data.order : 0,
      };
    });
    console.log('Processed categories:', categories);
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

export const uploadImage = async (uri: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting image manipulation...');
      
      // Manipulate image
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: SaveFormat.JPEG
        }
      );

      const filename = `images/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Create XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open('GET', manipulatedImage.uri, true);
      xhr.responseType = 'blob';
      
      xhr.onload = async () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          console.log('Blob created, size:', blob.size);
          
          try {
            const metadata = {
              contentType: 'image/jpeg'
            };
            
            const snapshot = await uploadBytes(storageRef, blob, metadata);
            const downloadURL = await getDownloadURL(snapshot.ref);
            resolve(downloadURL);
          } catch (uploadError) {
            console.error('Upload failed:', uploadError);
            reject(uploadError);
          }
        } else {
          reject(new Error('Failed to fetch image'));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Failed to fetch image'));
      };
      
      xhr.send();
      
    } catch (error) {
      console.error('Process error:', error);
      reject(error);
    }
  });
};

// Add this function with your other Firebase functions
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const productDoc = doc(productsCollection, id);
    const productSnapshot = await getDoc(productDoc);
    
    if (productSnapshot.exists()) {
      return productSnapshot.data() as Product;
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

export const createPromotion = async (promotionData: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>) => {
  const promotionRef = doc(collection(db, 'promotions'));
  const timestamp = new Date();
  await setDoc(promotionRef, { ...promotionData, createdAt: timestamp, updatedAt: timestamp });
};

export const getAllPromotions = async () => {
  const promotionsRef = collection(db, 'promotions');
  const snapshot = await getDocs(promotionsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


export const getPromotionById = async (id: string): Promise<Promotion | null> => {
  const docRef = doc(db, 'promotions', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date()
    } as Promotion;
  }
  return null;
};

export const updatePromotion = async (id: string, data: any) => {
  const docRef = doc(db, 'promotions', id);
  await updateDoc(docRef, data);
};

export const deletePromotion = async (id: string) => {
  const docRef = doc(db, 'promotions', id);
  await deleteDoc(docRef);
};

export const getAllUsers = async () => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => doc.data() as UserData);
};

export const updateUserRole = async (userId: string, newRole: UserRole) => {
  const userRef = doc(usersCollection, userId);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: new Date(),
  });
};

// Add this function to check a user's role directly from Firestore
export const verifyUserRole = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data from Firestore:', userData); // Debug log
      return userData.role;
    }
    return null;
  } catch (error) {
    console.error('Error verifying user role:', error);
    return null;
  }
};

// Add this function to handle new user registration
export const createNewUser = async (uid: string, email: string) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid,
    email,
    role: 'Pending', // Default role for new users
    createdAt: serverTimestamp(),
  });
};