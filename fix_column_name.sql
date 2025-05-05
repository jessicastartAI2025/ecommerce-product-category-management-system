-- SQL script to rename parentId column to parent_id in categories table

-- First, disable triggers to prevent any interference
ALTER TABLE categories DISABLE TRIGGER ALL;

-- Rename the column from parentId to parent_id
ALTER TABLE categories 
RENAME COLUMN "parentId" TO parent_id;

-- Re-enable the triggers
ALTER TABLE categories ENABLE TRIGGER ALL;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'parent_id'; 