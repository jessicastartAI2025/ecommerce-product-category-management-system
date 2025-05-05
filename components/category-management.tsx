"use client"

import React, { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Plus, Save, RotateCcw, Edit, Check, X, ChevronRight, Folder } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DeleteCategoryDialog } from "@/components/delete-category-dialog"
import { CategoryTree, createValidCategoryId } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// Use stable UUIDs for default categories (CRITICAL FIX)
// These UUIDs are fixed and won't change on every component mount
const defaultCategories: CategoryTree[] = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    name: "Clothing",
    children: [
      {
        id: "00000000-0000-4000-a000-000000000002",
        name: "Men's Wear",
        children: [
          {
            id: "00000000-0000-4000-a000-000000000003",
            name: "Shirts",
            children: [
              { id: "00000000-0000-4000-a000-000000000004", name: "Casual", children: [] },
              { id: "00000000-0000-4000-a000-000000000005", name: "Formal", children: [] }
            ]
          },
          {
            id: "00000000-0000-4000-a000-000000000006",
            name: "Pants",
            children: [
              { id: "00000000-0000-4000-a000-000000000007", name: "Jeans", children: [] },
              { id: "00000000-0000-4000-a000-000000000008", name: "Chinos", children: [] }
            ]
          }
        ]
      },
      {
        id: "00000000-0000-4000-a000-000000000009",
        name: "Women's Wear",
        children: [
          {
            id: "00000000-0000-4000-a000-000000000010",
            name: "Dresses",
            children: [
              { id: "00000000-0000-4000-a000-000000000011", name: "Casual", children: [] },
              { id: "00000000-0000-4000-a000-000000000012", name: "Evening", children: [] }
            ]
          },
          {
            id: "00000000-0000-4000-a000-000000000013",
            name: "Tops",
            children: [
              { id: "00000000-0000-4000-a000-000000000014", name: "Blouses", children: [] },
              { id: "00000000-0000-4000-a000-000000000015", name: "T-shirts", children: [] }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "00000000-0000-4000-a000-000000000016",
    name: "Electronics",
    children: [
      {
        id: "00000000-0000-4000-a000-000000000017",
        name: "Computers",
        children: [
          { id: "00000000-0000-4000-a000-000000000018", name: "Laptops", children: [] },
          { id: "00000000-0000-4000-a000-000000000019", name: "Desktops", children: [] }
        ]
      },
      {
        id: "00000000-0000-4000-a000-000000000020",
        name: "Mobile Devices",
        children: [
          { id: "00000000-0000-4000-a000-000000000021", name: "Smartphones", children: [] },
          { id: "00000000-0000-4000-a000-000000000022", name: "Tablets", children: [] }
        ]
      }
    ]
  },
  {
    id: "00000000-0000-4000-a000-000000000023",
    name: "Home & Garden",
    children: [
      { id: "00000000-0000-4000-a000-000000000024", name: "Furniture", children: [] },
      { id: "00000000-0000-4000-a000-000000000025", name: "Kitchen Appliances", children: [] }
    ]
  }
]

export function CategoryManagement() {
  // eslint-disable-next-line react/jsx-key
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryTree | null>(null)
  const [editingCategory, setEditingCategory] = useState<{ id: string, name: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryTree | null>(null)
  const [addingSubcategory, setAddingSubcategory] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Initialize expanded nodes
  useEffect(() => {
    const initExpanded: Record<string, boolean> = {};
    categories.forEach(cat => {
      initExpanded[cat.id] = true;
    });
    setExpandedNodes(initExpanded);
  }, [categories]);

  // Load categories from API on component mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/categories')
        
        if (!response.ok) {
          throw new Error('Failed to load categories')
        }
        
        const data = await response.json()
        
        if (data && data.length > 0) {
          setCategories(data)
        } else {
          // If no categories yet, use defaults
          setCategories(defaultCategories)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
        toast({
          title: "Error",
          description: "Failed to load categories. Using defaults.",
          variant: "destructive"
        })
        setCategories(defaultCategories)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCategories()
  }, [toast])

  // Function to save all changes to API (bulk operation for category structure)
  const saveChanges = async () => {
    try {
      setIsSaving(true)
      
      console.log(`Saving category structure with ${categories.length} categories`);
      
      // Validate all category IDs before sending to API
      const validateUUIDs = (items: CategoryTree[]): { valid: boolean; invalidIds: string[] } => {
        const invalidIds: string[] = [];
        
        const checkItem = (item: CategoryTree) => {
          if (!item.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
            invalidIds.push(item.id || 'undefined');
          }
          
          if (item.children && item.children.length > 0) {
            item.children.forEach(checkItem);
          }
        };
        
        items.forEach(checkItem);
        
        return {
          valid: invalidIds.length === 0,
          invalidIds
        };
      };
      
      // Pre-validation check
      const validation = validateUUIDs(categories);
      if (!validation.valid) {
        console.error('Invalid UUIDs detected:', validation.invalidIds);
        throw new Error(`Invalid UUID format in category IDs: ${validation.invalidIds.join(', ')}`);
      }
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categories),
        cache: 'no-cache',
      })
      
      console.log('Save response status:', response.status);
      
      if (!response.ok) {
        // Try to get the error message from the response, but handle cases where it might not be valid JSON
        let errorMessage = 'Failed to save categories';
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              console.error('Error details:', errorData.details);
            }
            if (errorData.code) {
              console.error('Error code:', errorData.code);
            }
            if (errorData.invalidIds) {
              errorMessage += `: ${errorData.invalidIds.join(', ')}`;
            }
          }
        } catch (jsonError) {
          console.error('Could not parse error response as JSON:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Safely parse the response
      let savedData;
      try {
        savedData = await response.json();
        console.log('Save response data:', savedData);
      } catch (error) {
        console.error('Error parsing response JSON:', error);
        throw new Error('Invalid response format from server');
      }
      
      // Calculate how many changes were made
      if (savedData && typeof savedData === 'object') {
        const created = savedData.created?.length || 0;
        const updated = savedData.updated?.length || 0;
        const deleted = savedData.deleted?.length || 0;
        const totalChanges = created + updated + deleted;
        
        // Provide more detailed success message
        let description = "All changes saved successfully!";
        if (totalChanges > 0) {
          const parts = [];
          if (created > 0) parts.push(`${created} created`);
          if (updated > 0) parts.push(`${updated} updated`);
          if (deleted > 0) parts.push(`${deleted} deleted`);
          description = `Changes saved: ${parts.join(', ')}`;
        }
        
        toast({
          title: "Success",
          description,
        });
      } else {
        toast({
          title: "Success",
          description: "Categories saved successfully!",
        });
      }
    } catch (error) {
      console.error('Error saving categories:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save categories.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to add a new root category
  const addRootCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        // Show loading state
        setIsSaving(true)
        
        // Create new category object
        const newCategory: CategoryTree = {
          id: createValidCategoryId(),
          name: newCategoryName,
          children: []
        }
        
        try {
          // Try to call the POST API endpoint
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCategory) // Send single category, not an array
          })
          
          // Handle error responses better
          if (!response.ok) {
            // Try to get the error message from the response, but handle cases where it might not be valid JSON
            let errorMessage = 'Failed to create category';
            try {
              const errorData = await response.json();
              if (errorData && errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (jsonError) {
              console.error('Could not parse error response as JSON:', jsonError);
            }
            throw new Error(errorMessage);
          }
          
          // Safely parse the response
          let createdCategory;
          try {
            createdCategory = await response.json();
          } catch (error) {
            console.error('Error parsing response JSON:', error);
            throw new Error('Invalid response format from server');
          }
          
          // Update local state with the created category 
          // (using the returned data to ensure we have server-generated values)
          const categoryToAdd: CategoryTree = {
            id: createdCategory.id,
            name: createdCategory.name,
            children: []
          }
          
          setCategories([...categories, categoryToAdd])
        } catch (fetchError) {
          console.error('Network error creating category:', fetchError)
          
          // FALLBACK: Use mock response for demo purposes when API fails
          console.log('Using local fallback for demonstration')
          
          // Add the category locally without API
          setCategories([...categories, newCategory])
          
          toast({
            title: "Demo Mode",
            description: "Network error - category added locally only (demo mode)",
            variant: "default"
          })
        }
        
        // Reset form state
        setNewCategoryName("")
        setShowAddCategory(false)
      } catch (error) {
        console.error('Error creating category:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create category",
          variant: "destructive"
        })
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Function to handle category click
  const handleCategoryClick = (category: CategoryTree) => {
    setSelectedCategory(category)
  }

  // Function to add a subcategory to the selected category
  const addSubcategory = async () => {
    if (!selectedCategory || !selectedCategory.id) {
      toast({
        title: "Error",
        description: "Cannot add subcategory: Invalid parent category",
        variant: "destructive"
      });
      setAddingSubcategory(false);
      return;
    }
    
    if (!newSubcategoryName.trim()) {
      toast({
        title: "Error", 
        description: "Category name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Show loading state
      setIsSaving(true)
      
      // Validate that the parent category ID is a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCategory.id)) {
        throw new Error('Invalid UUID format in parent category ID');
      }
      
      // Create new subcategory object
      const newSubcategory = {
        name: newSubcategoryName,
        parentId: selectedCategory.id, // Set parent ID for API
        order: selectedCategory.children?.length || 0 // Set order as last item
      }
      
      // Call the POST API endpoint
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSubcategory)
      })
      
      // Handle error responses better
      if (!response.ok) {
        // Try to get the error message from the response, but handle cases where it might not be valid JSON
        let errorMessage = 'Failed to create subcategory';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          console.error('Could not parse error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }
      
      // Clone the response before reading its body
      const responseClone = response.clone();
      let createdCategory;
      try {
        createdCategory = await response.json();
      } catch (error) {
        console.error('Error parsing response JSON:', error);
        throw new Error('Invalid response format from server');
      }
      
      // Convert API response to CategoryTree format
      const newSubcategoryTree: CategoryTree = {
        id: createdCategory.id,
        name: createdCategory.name,
        children: []
      }

      // Update local state by adding the subcategory to the selected category
      const addChildCategory = (items: CategoryTree[]): CategoryTree[] => {
        return items.map(item => {
          if (item.id === selectedCategory.id) {
            return {
              ...item,
              children: [...(item.children || []), newSubcategoryTree]
            }
          } else if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: addChildCategory(item.children)
            }
          }
          return item
        })
      }

      setCategories(addChildCategory(categories))
      
      // Show success message
      toast({
        title: "Success",
        description: "Subcategory created successfully",
      })
      
      // Reset form state
      setNewSubcategoryName("")
      setAddingSubcategory(false)
    } catch (error) {
      console.error('Error creating subcategory:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subcategory",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to start editing a category
  const startEditing = (category: CategoryTree) => {
    if (!category || !category.id) {
      console.error('Cannot edit category: Invalid category or missing ID');
      toast({
        title: "Error",
        description: "Cannot edit this category. Invalid category data.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingCategory({ id: category.id, name: category.name });
  }

  // Function to save edited category
  const saveEditing = async () => {
    if (!editingCategory || !editingCategory.id) {
      console.error('Cannot update category: Missing category ID');
      toast({
        title: "Error",
        description: "Cannot update category: Invalid or missing category ID",
        variant: "destructive"
      });
      setEditingCategory(null);
      return;
    }

    try {
      // Show loading state
      setIsSaving(true)
      
      console.log('Updating category with ID:', editingCategory.id);
      
      // Validate that the category ID is a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingCategory.id)) {
        throw new Error('Invalid UUID format in category IDs');
      }
      
      // Call the PATCH API endpoint
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCategory.name
        })
      })
      
      // Handle error responses better
      if (!response.ok) {
        // Try to get the error message from the response, but handle cases where it might not be valid JSON
        let errorMessage = 'Failed to update category';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          console.error('Could not parse error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }
      
      // Update local state
      const updateCategoryName = (items: CategoryTree[]): CategoryTree[] => {
        return items.map(item => {
          if (item.id === editingCategory.id) {
            return {
              ...item,
              name: editingCategory.name
            }
          } else if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateCategoryName(item.children)
            }
          }
          return item
        })
      }

      setCategories(updateCategoryName(categories))
      
      // Show success message
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive"
      })
    } finally {
      setEditingCategory(null)
      setIsSaving(false)
    }
  }

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingCategory(null)
  }

  // Function to handle category deletion
  const handleDeleteCategory = (category: CategoryTree) => {
    if (!category || !category.id) {
      console.error('Cannot delete category: Invalid category or missing ID');
      toast({
        title: "Error",
        description: "Cannot delete this category. Invalid category data.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate that the category ID is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category.id)) {
      console.error('Invalid UUID format:', category.id);
      toast({
        title: "Error",
        description: "Invalid UUID format in category ID",
        variant: "destructive"
      });
      return;
    }
    
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  // Function to confirm category deletion
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || !categoryToDelete.id) {
      console.error('Cannot delete category: Missing category ID');
      toast({
        title: "Error",
        description: "Cannot delete category: Invalid or missing ID",
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      return;
    }

    try {
      // Show loading state
      setIsSaving(true)
      
      // Validate that the category ID is a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryToDelete.id)) {
        throw new Error('Invalid UUID format in category ID');
      }
      
      // Call the DELETE API endpoint
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      // Handle error responses better
      if (!response.ok) {
        // Try to get the error message from the response, but handle cases where it might not be valid JSON
        let errorMessage = 'Failed to delete category';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          console.error('Could not parse error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }
      
      // Update local state
      const removeCategory = (items: CategoryTree[]): CategoryTree[] => {
        return items.filter(item => item.id !== categoryToDelete.id).map(item => ({
          ...item,
          children: item.children ? removeCategory(item.children) : []
        }))
      }
      
      setCategories(removeCategory(categories))
      
      // Show success message
      toast({
        title: "Success",
        description: `Category "${categoryToDelete.name}" deleted successfully`,
      })
      
      // Clear selected category if needed
      if (selectedCategory && selectedCategory.id === categoryToDelete.id) {
        setSelectedCategory(null)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive"
      })
    } finally {
      // Clear state and close dialog
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      setIsSaving(false)
    }
  }

  // Function to reset categories to default
  const resetToDefault = () => {
    setCategories(defaultCategories)
    setSelectedCategory(null)
    setEditingCategory(null)
  }

  // Function to handle canceling add category
  const handleCancelAdd = () => {
    setNewCategoryName("")
    setShowAddCategory(false)
  }

  // Function to handle canceling add subcategory
  const handleCancelAddSubcategory = () => {
    setNewSubcategoryName("")
    setAddingSubcategory(false)
  }

  // Function to toggle a node's expanded state
  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Recursive function to render category tree
  const renderCategory = (node: CategoryTree, level: number = 0) => {
    const isEditing = editingCategory?.id === node.id;
    const isSelected = selectedCategory?.id === node.id;
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isDeleting = isSaving && categoryToDelete?.id === node.id;

    return (
      <div className="select-none" key={node.id}>
        <div 
          className={`
            flex items-center py-1 rounded-sm 
            ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'} 
            cursor-pointer
            pl-${level > 0 ? (level * 4) : 2}
          `}
          onClick={() => handleCategoryClick(node)}
        >
          {hasChildren ? (
            <div 
              className="mr-1 rounded-sm hover:bg-muted"
              onClick={(e) => toggleNode(node.id, e)}
            >
              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isExpanded ? "transform rotate-90" : ""
                }`}
              />
            </div>
          ) : (
            <div className="w-4 h-4 mr-1"></div>
          )}
          
          {!isEditing ? (
            <>
              <Folder className="h-4 w-4 shrink-0 mr-2" />
              <span className="text-sm truncate">{node.name}</span>
              <div className="ml-auto flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(node);
                  }}
                  disabled={isSaving}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(node);
                  }}
                  disabled={isSaving}
                >
                  {isDeleting ? 
                    <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : 
                    <X className="h-3 w-3" />
                  }
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input 
                value={editingCategory?.name || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory!, name: e.target.value })}
                className="h-7 text-sm max-w-[200px] mr-2"
                onClick={(e) => e.stopPropagation()}
                disabled={isSaving}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600"
                onClick={(e) => {
                  e.stopPropagation();
                  saveEditing();
                }}
                disabled={isSaving}
              >
                {isSaving ? 
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : 
                  <Check className="h-3 w-3" />
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditing();
                }}
                disabled={isSaving}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {/* eslint-disable-next-line react/jsx-key */}
            {node.children!.map(childNode => (
              <React.Fragment key={childNode.id}>
                {renderCategory(childNode, level + 1)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-background rounded-lg shadow-sm border">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Category Management</h1>
        <p className="text-muted-foreground">
          Organize your product categories by creating a hierarchical structure
        </p>
      </div>
      
      <div className="flex flex-col space-y-2 mb-6">
        <div className="flex justify-between">
          <Button 
            onClick={saveChanges} 
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefault}
            disabled={isSaving || isLoading}
          >
            Reset to Default
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Individual operations (add, edit, delete) are saved immediately. Click "Save All Changes" to save organizational changes.
        </p>
      </div>
      
      <div className="border rounded-md p-4 mb-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="min-h-[200px]">
              {/* eslint-disable-next-line react/jsx-key */}
              {categories.map(node => (
                <React.Fragment key={node.id}>
                  {renderCategory(node)}
                </React.Fragment>
              ))}
            </div>
            
            {showAddCategory ? (
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="max-w-xs"
                  disabled={isSaving}
                />
                <Button 
                  onClick={addRootCategory}
                  size="sm"
                  disabled={!newCategoryName.trim() || isSaving}
                >
                  {isSaving ? "Adding..." : "Add"}
                </Button>
                <Button 
                  onClick={handleCancelAdd}
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowAddCategory(true)}
                variant="outline" 
                className="mt-4"
                size="sm"
                disabled={isSaving}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Root Category
              </Button>
            )}
            
            {selectedCategory && !addingSubcategory && (
              <Button 
                onClick={() => setAddingSubcategory(true)}
                variant="outline" 
                className="mt-4 ml-2"
                size="sm"
                disabled={isSaving}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
              </Button>
            )}
            
            {selectedCategory && addingSubcategory && (
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="New subcategory name"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  className="max-w-xs"
                  disabled={isSaving}
                />
                <Button 
                  onClick={addSubcategory}
                  size="sm"
                  disabled={!newSubcategoryName.trim() || isSaving}
                >
                  {isSaving ? "Adding..." : "Add"}
                </Button>
                <Button 
                  onClick={handleCancelAddSubcategory}
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  )
} 