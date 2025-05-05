import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Get environment variables or use default empty values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log initialization status (for debugging)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing - using mock client. This will not persist data!');
  console.warn('Make sure .env.local contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
} else {
  console.log('Supabase client initialized with credentials');
}

// Create supabase client with environment variables or mock client if missing
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    })
  : {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              data: [],
              error: null
            }),
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        delete: () => ({
          eq: () => ({
            data: null,
            error: null
          })
        }),
        insert: () => ({
          select: () => ({
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              data: [],
              error: null
            }),
            data: [],
            error: null
          })
        })
      })
    } as any;

// Type definitions for our database schema
export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  sort_order: number;
}

// Type for the hierarchical tree representation
export type CategoryTree = {
  id: string;
  name: string;
  children: CategoryTree[];
}

// Function to check if a string is a valid UUID
export function isValidUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

// Debug helper to validate IDs in a category tree
export function validateCategoryTreeIds(tree: CategoryTree[]): { valid: boolean, invalidIds: string[] } {
  const invalidIds: string[] = [];
  
  function validate(nodes: CategoryTree[]) {
    for (const node of nodes) {
      if (!isValidUUID(node.id)) {
        invalidIds.push(node.id);
      }
      if (node.children && node.children.length > 0) {
        validate(node.children);
      }
    }
  }
  
  validate(tree);
  return { valid: invalidIds.length === 0, invalidIds };
}

// Function to convert flat categories to tree structure
export function categoriesToTree(categories: Category[], parentId: string | null = null): CategoryTree[] {
  return categories
    .filter(category => category.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(category => ({
      id: category.id,
      name: category.name,
      children: categoriesToTree(categories, category.id)
    }));
}

// Function to flatten tree to categories
export function treeToCategories(tree: CategoryTree[], parentId: string | null = null, userId: string, level: number = 0): Partial<Category>[] {
  return tree.flatMap((node, index) => [
    {
      id: node.id,
      name: node.name,
      parent_id: parentId,
      user_id: userId,
      sort_order: index + (level * 1000)
    },
    ...treeToCategories(node.children, node.id, userId, level + 1)
  ]);
}

// Create a validated UUID string (to replace direct uuidv4 usage)
export function createValidCategoryId(): string {
  return uuidv4();
} 