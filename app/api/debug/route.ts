import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Basic auth check - only authenticated users can access debug info
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we have Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Check database connection
    const { data: tablesData, error: tablesError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    // Get table information
    const { data: tableInfo, error: tableInfoError } = await supabase
      .rpc('debug_table_info', { table_name: 'categories' })
      .select();
    
    // Check if the categories table exists
    const { data: tableExists, error: tableExistsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'categories')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      supabase: {
        configured: !!(supabaseUrl && supabaseKey),
        connection: !tablesError ? 'Connected' : 'Failed',
        error: tablesError,
      },
      table: {
        exists: tableExists?.length > 0,
        info: tableInfo || null,
        error: tableInfoError,
      },
      auth: {
        userId,
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Error in debug endpoint',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 