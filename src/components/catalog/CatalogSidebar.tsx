import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface CatalogSidebarProps {
  categories: Category[];
  currentCategorySlug?: string;
}

export function CatalogSidebar({ categories, currentCategorySlug }: CatalogSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4">
        <nav className="space-y-1">
          {categories.map((category) => {
            const isActive = currentCategorySlug === category.slug;
            return (
              <Link
                key={category.id}
                to={`/catalog/${category.slug}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted"
                )}
              >
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-6 h-6 object-cover rounded"
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    {category.name.charAt(0)}
                  </div>
                )}
                <span className="flex-1 text-sm">{category.name}</span>
                <ChevronRight className={cn("h-4 w-4", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
