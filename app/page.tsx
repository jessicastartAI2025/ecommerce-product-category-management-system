import { CategoryManagement } from "@/components/category-management"
import { UserButton } from "@clerk/nextjs"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            E-commerce Category Management
          </h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
        <CategoryManagement />
      </div>
    </div>
  )
}
