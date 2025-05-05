// test_supabase.js
// Script to test Supabase connection and query the categories table

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Setup to load environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function to fetch categories
async function fetchCategories() {
  console.log('Connecting to Supabase and fetching categories...');
  
  try {
    // Query categories
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
      
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    // Display results
    console.log('✅ Successfully connected to Supabase!');
    console.log(`Found ${data.length} categories in the database`);
    
    if (data.length > 0) {
      console.log('\nCategory data:');
      data.forEach(category => {
        console.log(`- ${category.name} (ID: ${category.id}, Parent: ${category.parent_id || 'None'})`);
      });
    } else {
      console.log('\nNo categories found. Your database table may be empty.');
    }
    
    // Additional database information
    const { data: tableInfo, error: tableError } = await supabase
      .from('categories')
      .select('created_at')
      .limit(1);
      
    if (!tableError) {
      console.log('\nDatabase connection is working properly!');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
fetchCategories(); 