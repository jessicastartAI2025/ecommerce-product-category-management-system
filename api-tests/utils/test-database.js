/**
 * Mock database utilities for API testing
 * 
 * This simulates a database without actually connecting to Supabase
 */

// In-memory database for testing
let testDatabase = {
  categories: []
};

/**
 * Reset the test database to initial state
 * @param {Object} initialData Optional initial data to populate
 */
function resetDatabase(initialData = {}) {
  testDatabase = {
    categories: initialData.categories || [],
    ...initialData
  };
}

/**
 * Insert categories into the test database
 * @param {Array} categories Categories to insert
 * @returns {Array} Inserted categories with IDs
 */
function insertCategories(categories) {
  if (!Array.isArray(categories)) {
    categories = [categories];
  }

  // Add IDs and timestamps if not present
  const now = new Date().toISOString();
  const insertedCategories = categories.map(category => ({
    id: category.id || `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: category.name,
    parent_id: category.parentId || null,
    user_id: category.user_id || 'test-user-uuid',
    created_at: now,
    updated_at: now,
    sort_order: category.order || 0,
    ...category
  }));
  
  // Add to test database
  testDatabase.categories = [
    ...testDatabase.categories,
    ...insertedCategories
  ];
  
  return insertedCategories;
}

/**
 * Get categories from the test database
 * @param {string} userId User ID to filter by
 * @returns {Array} Categories for the user
 */
function getCategories(userId = 'test-user-uuid') {
  return testDatabase.categories.filter(cat => cat.user_id === userId);
}

/**
 * Update a category in the test database
 * @param {string} id Category ID to update
 * @param {Object} data New category data
 * @returns {Object} Updated category
 */
function updateCategory(id, data) {
  const index = testDatabase.categories.findIndex(cat => cat.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Update the category
  const now = new Date().toISOString();
  const updatedCategory = {
    ...testDatabase.categories[index],
    name: data.name || testDatabase.categories[index].name,
    parent_id: data.parentId !== undefined ? data.parentId : testDatabase.categories[index].parent_id,
    sort_order: data.order !== undefined ? data.order : testDatabase.categories[index].sort_order,
    updated_at: now
  };
  
  testDatabase.categories[index] = updatedCategory;
  return updatedCategory;
}

/**
 * Delete a category from the test database
 * @param {string} id Category ID to delete
 * @returns {boolean} Success status
 */
function deleteCategory(id) {
  const initialLength = testDatabase.categories.length;
  testDatabase.categories = testDatabase.categories.filter(cat => cat.id !== id);
  
  return testDatabase.categories.length < initialLength;
}

/**
 * Mock Supabase client for testing
 */
const mockSupabaseClient = {
  from: (table) => {
    if (table !== 'categories') {
      throw new Error(`Table ${table} not mocked`);
    }
    
    return {
      select: () => ({
        eq: (field, value) => ({
          order: () => ({
            data: getCategories(value),
            error: null
          })
        })
      }),
      insert: (data) => ({
        select: () => ({
          data: insertCategories(data),
          error: null
        })
      }),
      update: (data) => ({
        eq: (field, value) => ({
          select: () => ({
            data: updateCategory(value, data),
            error: null
          })
        })
      }),
      delete: () => ({
        eq: (field, value) => ({
          data: { success: deleteCategory(value) },
          error: null
        })
      })
    };
  }
};

module.exports = {
  resetDatabase,
  insertCategories,
  getCategories,
  updateCategory,
  deleteCategory,
  mockSupabaseClient
}; 