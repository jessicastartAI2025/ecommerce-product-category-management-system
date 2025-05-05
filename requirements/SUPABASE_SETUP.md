# Setting up Supabase Integration

This project uses Supabase for database and storage. Follow these steps to set it up:

## 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under Project Settings > API.

## 2. Database Structure

We've set up the following tables in Supabase:

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

### Storage Buckets
We're using the following storage buckets:
- `category-images`: For storing category images
- `user-assets`: For storing user-related assets

## 3. Row-Level Security

To secure your data, make sure to set up Row-Level Security policies in Supabase:

For the categories table:
```sql
-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own data
CREATE POLICY "Users can only access their own categories"
  ON categories
  FOR ALL
  USING (user_id = auth.uid());
```

## 4. Integration with Clerk

When a user signs in with Clerk, we need to associate their Clerk ID with a Supabase user ID.
Check the integration code in the application for details on this connection. 