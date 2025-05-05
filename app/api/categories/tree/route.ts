import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { categoriesToTree, treeToCategories, validateCategoryTreeIds } from '@/lib/supabase';
import { createHash } from 'crypto';

// Helper function to generate a deterministic UUID v5 from a string
function generateUUIDv5(input: string): string {
  // Create a namespace (using a fixed UUID)
  const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  
  // Parse namespace
  const namespaceBytes: number[] = [];
  NAMESPACE.replace(/[a-fA-F0-9]{2}/g, (hex) => {
    namespaceBytes.push(parseInt(hex, 16));
    return '';
  });
  
  // Create a hash of namespace + input
  const hash = createHash('sha1')
    .update(Buffer.from(namespaceBytes))
    .update(input)
    .digest('hex');
  
  // Format as UUID v5
  const result = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    // Version 5 UUID - set high nibble to 5
    (parseInt(hash.substring(12, 13), 16) & 0x3 | 0x5).toString(16) + hash.substring(13, 16),
    // Variant 1 - set high bits to 10
    (parseInt(hash.substring(16, 18), 16) & 0x3f | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
  
  return result;
}

// Generate a consistent UUID for the user
function getUserUUID(userId: string): string {
  // Create a UUID that will be the same for the same Clerk user ID
  return generateUUIDv5(userId);
}

/**
 * GET /api/categories/tree
 * Returns the hierarchical tree structure of categories for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching category tree for Clerk user:', userId);
    const userUUID = getUserUUID(userId);
    
    // Use UUID for Supabase query
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userUUID)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert to tree structure
    const categoriesTree = categoriesToTree(categories || []);
    
    return NextResponse.json(categoriesTree);
  } catch (error) {
    console.error('Error in GET categories tree:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * PUT /api/categories/tree
 * Saves the entire hierarchical category structure for the authenticated user.
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Saving category tree for Clerk user:', userId);
    const userUUID = getUserUUID(userId);
    
    const categoryTree = await req.json();
    
    // Validate the category structure
    if (!Array.isArray(categoryTree)) {
      return NextResponse.json({ error: 'Invalid category structure. Expected an array.' }, { status: 400 });
    }
    
    // Validate that all category IDs are valid UUIDs
    const validation = validateCategoryTreeIds(categoryTree);
    if (!validation.valid) {
      console.error('Invalid UUID format in categories:', validation.invalidIds);
      return NextResponse.json({ 
        error: 'Invalid UUID format in category IDs', 
        invalidIds: validation.invalidIds 
      }, { status: 400 });
    }
    
    // Convert tree structure to flat categories with proper parent-child relationships
    // Add current timestamps to all entries
    const now = new Date().toISOString();
    const categories = treeToCategories(categoryTree, null, userUUID).map(cat => ({
      ...cat,
      created_at: now,
      updated_at: now
    }));
    
    console.log(`Processing ${categories.length} categories to save`);
    
    // First, fetch existing categories to track changes
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userUUID);
      
    if (fetchError) {
      console.error('Error fetching existing categories:', fetchError);
      return NextResponse.json({ 
        error: `Error fetching categories: ${fetchError.message}`, 
        details: fetchError
      }, { status: 500 });
    }
    
    // Create sets for tracking operations
    const existingIds = new Set(existingCategories?.map((c: { id: string }) => c.id) || []);
    const newIds = new Set(categories.map(c => c.id));
    
    // Track created, updated, and deleted IDs
    const created: string[] = [];
    const updated: string[] = [];
    const deleted: string[] = [];
    
    // Find deleted categories
    existingCategories?.forEach((cat: { id: string }) => {
      if (!newIds.has(cat.id)) {
        deleted.push(cat.id);
      }
    });
    
    // Find created/updated categories
    categories.forEach(cat => {
      if (existingIds.has(cat.id as string)) {
        updated.push(cat.id as string);
      } else {
        created.push(cat.id as string);
      }
    });
    
    // First, delete existing categories for this user
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', userUUID);
    
    if (deleteError) {
      console.error('Error deleting existing categories:', deleteError);
      return NextResponse.json({ 
        error: `Error deleting categories: ${deleteError.message}`, 
        details: deleteError
      }, { status: 500 });
    }
    
    // If there are no categories to insert, return success early
    if (categories.length === 0) {
      console.log('No categories to insert, returning empty array');
      return NextResponse.json({
        created: [],
        updated: [],
        deleted: deleted
      });
    }
    
    // Debug log a sample category before insertion
    console.log('Sample category for insertion:', JSON.stringify(categories[0]));
    
    // Then insert the new structure
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert(categories)
      .select();
    
    if (insertError) {
      console.error('Error inserting categories:', insertError);
      
      // More detailed debugging for insert error
      console.error('Insert Error Code:', insertError.code);
      console.error('Insert Error Details:', insertError.details);
      
      // Return detailed error for debugging
      return NextResponse.json({ 
        error: `Error inserting categories: ${insertError.message}`, 
        details: insertError,
        code: insertError.code,
        sampleCategory: categories[0],
        categoriesCount: categories.length
      }, { status: 500 });
    }
    
    console.log(`Successfully saved ${data?.length || 0} categories`);
    
    // Return professional-grade response with operation summaries
    return NextResponse.json({
      created,
      updated,
      deleted
    });
  } catch (error) {
    console.error('Error in PUT categories tree:', error);
    // Capture and return more details about the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/categories/tree
 * Alternative method to save the entire tree structure - redirects to PUT for RESTful consistency
 */
export async function POST(req: NextRequest) {
  // Redirect to PUT handler for consistency
  return PUT(req);
} 