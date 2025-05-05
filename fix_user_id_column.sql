-- SQL script to modify the user_id column in the categories table
-- Converts the user_id column from UUID type to TEXT type to support Clerk user IDs

-- First, we'll disable the trigger that might interfere with this change
ALTER TABLE categories DISABLE TRIGGER ALL;

-- Now, alter the column type from UUID to TEXT
ALTER TABLE categories 
ALTER COLUMN user_id TYPE TEXT;

-- Re-enable the triggers
ALTER TABLE categories ENABLE TRIGGER ALL;

-- Add a comment to explain the change
COMMENT ON COLUMN categories.user_id IS 'Clerk user ID in text format (e.g., user_2wUsqGRXsrr3oD5dsS8zJtGNXN4)';

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'user_id'; 