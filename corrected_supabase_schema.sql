-- Create the categories table with snake_case column names instead of camelCase
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_parent_order ON categories(parent_id, sort_order);

-- Create trigger for auto-updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own categories"
    ON categories FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own categories"
    ON categories FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    USING (user_id = auth.uid()::text); 