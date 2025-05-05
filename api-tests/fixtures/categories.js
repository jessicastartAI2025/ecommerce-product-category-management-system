/**
 * Test fixtures for category API tests
 */

// Valid category data for testing
const validCategory = {
  name: 'Test Category',
  parentId: null,
  order: 0
};

// Valid subcategory data
const validSubcategory = {
  name: 'Test Subcategory',
  // parentId will be dynamically set in tests
  order: 0
};

// Multiple categories for batch operations
const multipleCategories = [
  {
    name: 'Category 1',
    parentId: null,
    order: 0
  },
  {
    name: 'Category 2',
    parentId: null,
    order: 1
  }
];

// Invalid category data
const invalidCategory = {
  name: '', // Empty name
  parentId: 'not-a-uuid',
  order: 'not-a-number'
};

// Category update data
const categoryUpdate = {
  name: 'Updated Category Name'
};

module.exports = {
  validCategory,
  validSubcategory,
  multipleCategories,
  invalidCategory,
  categoryUpdate
}; 