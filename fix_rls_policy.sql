-- SQL script to fix Row Level Security policies for the categories table
-- The issue is that auth.uid() from Supabase auth doesn't match with Clerk user IDs

-- First, let's drop the existing RLS policies that aren't working
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- Create a new policy that allows all actions for all users (for development only)
-- In production, you would replace this with more secure policies
CREATE POLICY "Allow all operations on categories" 
ON categories 
FOR ALL 
USING (true);

-- For a more secure approach, you can enable service_role access only and use that role
-- from your application code. This requires setting up SUPABASE_SERVICE_KEY in your env variables.

-- Display current policies to verify changes
SELECT * FROM pg_policies WHERE tablename = 'categories'; 