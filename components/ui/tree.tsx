"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, Folder, File } from "lucide-react"

type TreeNodeType = {
  id: string
  name: string
  children?: TreeNodeType[]
}

interface TreeProps {
  data: TreeNodeType[]
  onNodeClick?: (node: TreeNodeType) => void
  onNodeDelete?: (node: TreeNodeType) => void
  className?: string
}

interface TreeNodeProps {
  node: TreeNodeType
  level: number
  onNodeClick?: (node: TreeNodeType) => void
  onNodeDelete?: (node: TreeNodeType) => void
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onNodeClick,
  onNodeDelete,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const hasChildren = node.children && node.children.length > 0

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(node)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onNodeDelete) {
      onNodeDelete(node)
    }
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center py-1 rounded-sm hover:bg-muted/50 cursor-pointer",
          level === 0 ? "pl-2" : `pl-${level * 4 + 2}`
        )}
        onClick={handleClick}
      >
        {hasChildren && (
          <div
            className="mr-1 rounded-sm hover:bg-muted"
            onClick={handleToggle}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                isOpen ? "transform rotate-90" : ""
              )}
            />
          </div>
        )}
        <Folder className="h-4 w-4 shrink-0 mr-2" />
        <span className="text-sm truncate">{node.name}</span>
        {onNodeDelete && (
          <button
            onClick={handleDelete}
            className="ml-auto mr-2 text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        )}
      </div>
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((childNode) => (
            <TreeNode
              key={childNode.id}
              node={childNode}
              level={level + 1}
              onNodeClick={onNodeClick}
              onNodeDelete={onNodeDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const Tree: React.FC<TreeProps> = ({
  data,
  onNodeClick,
  onNodeDelete,
  className,
}) => {
  return (
    <div className={cn("overflow-auto", className)}>
      {data.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onNodeClick={onNodeClick}
          onNodeDelete={onNodeDelete}
        />
      ))}
    </div>
  )
}

export type { TreeNodeType } 