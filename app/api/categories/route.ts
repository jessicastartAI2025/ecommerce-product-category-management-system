import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { categoriesToTree, treeToCategories, validateCategoryTreeIds, createValidCategoryId } from '@/lib/supabase';
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
 * GET /api/categories
 * Returns the hierarchical tree structure of categories for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching categories for Clerk user:', userId);
    const userUUID = getUserUUID(userId);
    console.log('Using UUID:', userUUID);
    
    // Parse URL to check if tree format is explicitly requested
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    
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

    // Default is tree format for backward compatibility with UI
    if (!format || format === 'tree') {
      // Convert to tree structure for frontend
      const categoriesTree = categoriesToTree(categories || []);
      return NextResponse.json(categoriesTree);
    } else {
      // Return flat list format if requested
      return NextResponse.json(categories || []);
    }
  } catch (error) {
    console.error('Error in GET categories:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * POST /api/categories
 * Saves the entire category structure for the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Saving categories for Clerk user:', userId);
    const userUUID = getUserUUID(userId);
    console.log('Using UUID:', userUUID);
    
    const categoryTree = await req.json();
    
    // Check if we're getting a single category or a tree
    const isSingleCategory = !Array.isArray(categoryTree) && categoryTree.name;
    
    // Add database debugging - log the database URL (redacted for security)
    console.log('Database URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    if (isSingleCategory) {
      // Handle single category creation
      const now = new Date().toISOString();
      const newCategory = {
        id: categoryTree.id || createValidCategoryId(),
        name: categoryTree.name,
        parent_id: categoryTree.parentId || null,
        user_id: userUUID,
        created_at: now,
        updated_at: now,
        sort_order: categoryTree.order || 0
      };
      
      const { data, error } = await supabase
        .from('categories')
        .insert(newCategory)
        .select();
        
      if (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ 
          error: `Error creating category: ${error.message}`, 
          details: error
        }, { status: 500 });
      }
      
      return NextResponse.json(data);
    } else {
      // Handle full tree update (original functionality maintained for UI compatibility)
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
        if (existingIds.has(cat.id)) {
          updated.push(cat.id);
        } else {
          created.push(cat.id);
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
    }
  } catch (error) {
    console.error('Error in POST categories:', error);
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
 * PUT /api/categories/tree
 * Saves an entire category tree structure for the authenticated user.
 * Redirects to POST for backward compatibility.
 */
export async function PUT(req: NextRequest) {
  // Reuse POST handler for backward compatibility
  return POST(req);
}

/**
 * PATCH /api/categories
 * Updates a category.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userUUID = getUserUUID(userId);
    const { id, ...updateData } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required for updates' }, { status: 400 });
    }
    
    // Convert field names to database convention if needed
    const dbUpdateData: any = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Convert parentId to parent_id if provided
    if (updateData.parentId !== undefined) {
      dbUpdateData.parent_id = updateData.parentId;
      delete dbUpdateData.parentId;
    }
    
    // Convert order to sort_order if provided
    if (updateData.order !== undefined) {
      dbUpdateData.sort_order = updateData.order;
      delete dbUpdateData.order;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .update(dbUpdateData)
      .eq('id', id)
      .select();
      
    // Handle the single record case manually
    const singleRecord = Array.isArray(data) && data.length > 0 ? data[0] : data;

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ 
        error: `Error updating category: ${error.message}`, 
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json(singleRecord);
  } catch (error) {
    console.error('Error in PATCH category:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * DELETE /api/categories
 * Deletes a category by ID.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userUUID = getUserUUID(userId);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ 
        error: `Error deleting category: ${error.message}`, 
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('Error in DELETE category:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 