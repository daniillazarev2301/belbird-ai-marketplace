import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Grid3X3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  children?: Category[];
}

export function CategoryMenu() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, image_url")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Build tree structure
      const rootCategories = (data || []).filter((c) => !c.parent_id);
      const buildTree = (parent: Category): Category => {
        const children = (data || []).filter((c) => c.parent_id === parent.id);
        return {
          ...parent,
          children: children.map(buildTree),
        };
      };

      return rootCategories.map(buildTree);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Grid3X3 className="h-4 w-4" />
          <span className="hidden sm:inline">Каталог</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Категории не найдены
          </div>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link
                to="/catalog"
                className="flex items-center gap-2 font-medium"
              >
                <Grid3X3 className="h-4 w-4" />
                Все товары
              </Link>
            </DropdownMenuItem>
            <div className="my-2 h-px bg-border" />
            {categories.map((category) => (
              <CategoryMenuItem key={category.id} category={category} />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryMenuItem({ category, level = 0 }: { category: Category; level?: number }) {
  const hasChildren = category.children && category.children.length > 0;

  if (hasChildren) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors">
            <span>{category.name}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56 p-2">
          <DropdownMenuItem asChild>
            <Link
              to={`/catalog/${category.slug}`}
              className="font-medium"
            >
              Все в "{category.name}"
            </Link>
          </DropdownMenuItem>
          <div className="my-2 h-px bg-border" />
          {category.children!.map((child) => (
            <CategoryMenuItem key={child.id} category={child} level={level + 1} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <Link to={`/catalog/${category.slug}`}>{category.name}</Link>
    </DropdownMenuItem>
  );
}
