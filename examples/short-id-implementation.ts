/**
 * SHORT ID & SLUG IMPLEMENTATION EXAMPLE
 * 
 * This file shows how to implement shorter, more user-friendly IDs for categories
 * while maintaining compatibility with the existing system.
 */

import { createClient } from '@supabase/supabase-js';
import { customAlphabet } from 'nanoid';
import slugify from 'slugify';

// Configure nanoid for short, URL-friendly IDs (7 chars = ~1 billion possibilities)
const generateShortId = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 7);

// 1. UPDATE DATABASE SCHEMA
// Execute this SQL in Supabase:
/*
-- Add short_id and slug columns to categories table
ALTER TABLE categories 
ADD COLUMN short_id TEXT UNIQUE,
ADD COLUMN slug TEXT;

-- Create indexes for efficient lookups
CREATE INDEX idx_categories_short_id ON categories(short_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Create function to generate a unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT := base_slug;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  LOOP
    -- Check if slug exists
    SELECT EXISTS(SELECT 1 FROM categories WHERE slug = new_slug) INTO slug_exists;
    
    -- Exit if unique
    EXIT WHEN NOT slug_exists;
    
    -- Add counter to make unique
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing categories to have short_id and slug
UPDATE categories
SET 
  short_id = CASE 
    WHEN short_id IS NULL THEN 
      substring(regexp_replace(gen_random_uuid()::text, '[^a-z0-9]', '', 'g'), 1, 7)
    ELSE
      short_id
  END,
  slug = CASE 
    WHEN slug IS NULL THEN 
      generate_unique_slug(
        regexp_replace(
          lower(name), 
          '[^a-z0-9]', 
          '-', 
          'g'
        )
      )
    ELSE
      slug
  END
WHERE short_id IS NULL OR slug IS NULL;
*/

// 2. HELPER FUNCTIONS FOR APPLICATION CODE

// Function to create a URL-friendly slug from a category name
function createSlug(name: string): string {
  return slugify(name, {
    lower: true,       // convert to lowercase
    strict: true,      // strip special chars
    trim: true         // trim leading/trailing spaces
  });
}

// Function to find a category by short ID or slug
async function findCategory(supabase: any, idOrSlug: string, userId: string) {
  // Try to find by short_id first (faster)
  let { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('short_id', idOrSlug)
    .eq('user_id', userId)
    .single();
    
  // If not found, try by slug
  if (!data && !error) {
    ({ data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', idOrSlug)
      .eq('user_id', userId)
      .single());
  }
  
  // If still not found, try by UUID (for backward compatibility)
  if (!data && !error) {
    ({ data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', idOrSlug)
      .eq('user_id', userId)
      .single());
  }
  
  return { data, error };
}

// 3. UPDATED API ROUTES

// Example of updated category creation with short ID and slug
async function createCategory(supabase: any, name: string, parentId: string | null, userId: string) {
  const shortId = generateShortId(); // Generate a short, unique ID
  const slug = createSlug(name);     // Generate a slug from the name
  
  const { data, error } = await supabase
    .from('categories')
    .insert({
      id: crypto.randomUUID(),   // Keep UUID for internal relations
      short_id: shortId,         // Add short ID for URLs
      slug: slug,                // Add slug for URLs
      name: name,
      parent_id: parentId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sort_order: 0
    })
    .select()
    .single();
    
  return { data, error };
}

// 4. COMPONENT UPDATES

// Example of how to update your React component:
/*
// Function to delete a category (updated)
const confirmDeleteCategory = async () => {
  if (categoryToDelete) {
    try {
      setIsSaving(true)
      
      // Use short_id instead of UUID for cleaner URLs
      const idForUrl = categoryToDelete.short_id || categoryToDelete.id;
      
      // Call the DELETE API endpoint with shorter ID
      const response = await fetch(`/api/categories/${idForUrl}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      // Rest of the function remains the same...
    }
  }
}
*/

// 5. MIGRATION STRATEGY
/*
1. Update database schema to add short_id and slug columns
2. Update existing categories with generated short_id and slug values
3. Modify API endpoints to accept short_id, slug, or UUID
4. Update frontend to use short_id in API calls
5. Keep UUID references internally for database relations
*/

export {
  generateShortId,
  createSlug,
  findCategory,
  createCategory
}; 