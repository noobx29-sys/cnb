import { db, users, products, categories, promotions, userSessions } from '@/lib/db';
import { eq, and, desc, asc, like, inArray } from 'drizzle-orm';
import type { User, Product, Category, Promotion, NewUser, NewProduct, NewCategory, NewPromotion } from '@/lib/db/schema';
import { uploadImageToCloudinary } from './cloudinary';

// Re-export types for compatibility
export type { User, Product, Category, Promotion, NewUser, NewProduct, NewCategory, NewPromotion };

// Additional types for compatibility with existing code
export interface UserData extends User {}

// User Management
export const createUser = async (userData: NewUser): Promise<User> => {
  const [newUser] = await db.insert(users).values(userData).returning();
  return newUser;
};

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const userList = await db.select().from(users).where(eq(users.id, uid));
  return userList[0] || null;
};

export const updateUserDocument = async (uid: string, userData: Partial<User>): Promise<void> => {
  await db.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, uid));
};

export const getAllUsers = async (): Promise<User[]> => {
  return await db.select().from(users).orderBy(asc(users.createdAt));
};

export const updateUserRole = async (userId: string, newRole: string): Promise<void> => {
  await db.update(users).set({ role: newRole, updatedAt: new Date() }).where(eq(users.id, userId));
};

export const verifyUserRole = async (userId: string, requiredRole: string): Promise<boolean> => {
  const user = await getUserDocument(userId);
  return user?.role === requiredRole || user?.role === 'admin';
};

// Product Management
export const createProduct = async (productData: NewProduct): Promise<Product> => {
  const [newProduct] = await db.insert(products).values(productData).returning();
  return newProduct;
};

export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<void> => {
  await db.update(products).set({ ...productData, updatedAt: new Date() }).where(eq(products.id, productId));
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await db.delete(products).where(eq(products.id, productId));
};

export const getAllProducts = async (): Promise<Product[]> => {
  return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  const productList = await db.select().from(products).where(eq(products.id, productId));
  return productList[0] || null;
};

// Helper function to get products with caching support
export const getProductsWithCache = async (): Promise<Product[]> => {
  const PRODUCTS_CACHE_KEY = 'products_cache';
  const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  
  try {
    // Try to fetch from database first
    const products = await getAllProducts();
    
    // Cache the products locally
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: products
    }));
    
    return products;
  } catch (error) {
    // If database request fails, try to get cached data
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const cachedData = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        
        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_EXPIRY_TIME) {
          return data;
        }
      }
    } catch (cacheError) {
      console.error('Error reading cache:', cacheError);
    }
    
    // If no cache or expired cache, throw original error
    throw error;
  }
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  return await db.select().from(products).where(
    and(eq(products.categoryId, categoryId), eq(products.isActive, true))
  ).orderBy(desc(products.createdAt));
};

// Category Management
export const createCategory = async (categoryData: NewCategory): Promise<Category> => {
  const [newCategory] = await db.insert(categories).values(categoryData).returning();
  return newCategory;
};

export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
  await db.update(categories).set({ ...categoryData, updatedAt: new Date() }).where(eq(categories.id, categoryId));
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await db.delete(categories).where(eq(categories.id, categoryId));
};

export const getAllCategories = async (): Promise<Category[]> => {
  return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
};

export const getCategoryById = async (categoryId: string): Promise<Category | null> => {
  const categoryList = await db.select().from(categories).where(eq(categories.id, categoryId));
  return categoryList[0] || null;
};

// Promotion Management
export const createPromotion = async (promotionData: Partial<NewPromotion> & { title: string; startDate: Date; endDate: Date }): Promise<Promotion> => {
  const [newPromotion] = await db.insert(promotions).values({
    ...promotionData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return newPromotion;
};

export const updatePromotion = async (promotionId: string, promotionData: Partial<Promotion>): Promise<void> => {
  await db.update(promotions).set({ ...promotionData, updatedAt: new Date() }).where(eq(promotions.id, promotionId));
};

export const deletePromotion = async (promotionId: string): Promise<void> => {
  await db.delete(promotions).where(eq(promotions.id, promotionId));
};

export const getAllPromotions = async (): Promise<Promotion[]> => {
  return await db.select().from(promotions).where(eq(promotions.isActive, true)).orderBy(desc(promotions.createdAt));
};

export const getActivePromotions = async (): Promise<Promotion[]> => {
  const now = new Date();
  return await db.select().from(promotions).where(
    eq(promotions.isActive, true)
    // TODO: Add date range checks when implementing promotion scheduling
  ).orderBy(desc(promotions.createdAt));
};

export const getPromotionsByProduct = async (productId: string): Promise<Promotion[]> => {
  return await db.select().from(promotions).where(
    and(
      eq(promotions.isActive, true)
      // TODO: Add productIds JSON array check when implementing product-specific promotions
    )
  ).orderBy(desc(promotions.createdAt));
};

// Search functionality
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  return await db.select().from(products).where(
    and(
      eq(products.isActive, true),
      like(products.name, `%${searchTerm}%`)
    )
  ).orderBy(desc(products.createdAt));
};

// File upload utility using Cloudinary
export const uploadImage = async (imageUri: string, path: string): Promise<string> => {
  try {
    return await uploadImageToCloudinary(imageUri, path);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Database cleanup utilities
export const cleanupExpiredSessions = async (): Promise<void> => {
  const now = new Date();
  // Import lt for less than comparison when needed
  // await db.delete(userSessions).where(lt(userSessions.expiresAt, now));
  console.log('Session cleanup would run here');
};

// Export database instance for direct queries if needed
export { db };