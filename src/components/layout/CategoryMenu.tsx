import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Grid3X3, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  children?: Category[];
}

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, image_url")
        .order("sort_order", { ascending: true });

      if (error) throw error;

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
    staleTime: 5 * 60 * 1000,
  });

  const handleCategoryClick = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setSelectedParent(category);
    } else {
      setOpen(false);
      setSelectedParent(null);
    }
  };

  const displayCategories = selectedParent ? selectedParent.children || [] : categories;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedParent(null);
    }}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Grid3X3 className="h-4 w-4" />
          <span className="hidden sm:inline">Каталог</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            {selectedParent ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedParent(null)}
                className="gap-1 -ml-2"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Назад
              </Button>
            ) : (
              <SheetTitle>Каталог</SheetTitle>
            )}
          </div>
          {selectedParent && (
            <div className="mt-2">
              <Link
                to={`/catalog/${selectedParent.slug}`}
                onClick={() => { setOpen(false); setSelectedParent(null); }}
                className="text-lg font-semibold hover:text-primary transition-colors"
              >
                {selectedParent.name}
              </Link>
            </div>
          )}
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <nav className="p-2">
              {!selectedParent && (
                <Link
                  to="/catalog"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors mb-1"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Grid3X3 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Все товары</span>
                </Link>
              )}
              
              {displayCategories.map((category) => {
                const hasChildren = category.children && category.children.length > 0;
                
                return (
                  <div key={category.id}>
                    {hasChildren ? (
                      <button
                        onClick={() => handleCategoryClick(category)}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                            {category.name.charAt(0)}
                          </div>
                        )}
                        <span className="flex-1 text-left font-medium">{category.name}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </button>
                    ) : (
                      <Link
                        to={`/catalog/${category.slug}`}
                        onClick={() => { setOpen(false); setSelectedParent(null); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                            {category.name.charAt(0)}
                          </div>
                        )}
                        <span className="flex-1 font-medium">{category.name}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
