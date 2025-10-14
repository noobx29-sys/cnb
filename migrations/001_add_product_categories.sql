-- Migration script to update the database schema for product page features

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS subsubcategory TEXT;

-- Add subCategories column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS sub_categories JSONB;

-- Update existing products to use categoryId if category is empty
-- This is a placeholder - you may need to adjust based on your data
-- UPDATE products SET category = categoryId WHERE category IS NULL AND categoryId IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);