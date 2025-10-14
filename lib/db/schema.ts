import { pgTable, text, timestamp, boolean, integer, decimal, jsonb, uuid } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('user').notNull(), // 'admin', 'user', 'guest'
  isActive: boolean('is_active').default(true).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  subCategories: jsonb('sub_categories').$type<{id: string, name: string, subCategories?: {id: string, name: string}[]}[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  category: text('category'), // For backward compatibility
  subcategory: text('subcategory'), // For backward compatibility  
  subsubcategory: text('subsubcategory'), // For backward compatibility
  imageUrl: text('image_url'),
  images: jsonb('images').$type<string[]>(), // Array of image URLs
  inStock: boolean('in_stock').default(true).notNull(),
  stockQuantity: integer('stock_quantity').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Promotions table
export const promotions = pgTable('promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  imageUrl: text('image_url'),
  productIds: jsonb('product_ids').$type<string[]>(), // Array of product IDs this promotion applies to
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User sessions table (for authentication)
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;