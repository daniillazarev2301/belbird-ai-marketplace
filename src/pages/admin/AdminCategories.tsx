import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  GripVertical,
  PawPrint,
  Home,
  Flower2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: Category[];
}

const categories: { id: string; name: string; icon: React.ElementType; productCount: number; children: Category[] }[] = [
  {
    id: "pets",
    name: "Любимцы",
    icon: PawPrint,
    productCount: 15420,
    children: [
      {
        id: "cats",
        name: "Кошки",
        slug: "cats",
        productCount: 5230,
        children: [
          { id: "cat-food", name: "Корма", slug: "cat-food", productCount: 1250 },
          { id: "cat-accessories", name: "Аксессуары", slug: "cat-accessories", productCount: 890 },
          { id: "cat-health", name: "Здоровье", slug: "cat-health", productCount: 456 },
          { id: "cat-toys", name: "Игрушки", slug: "cat-toys", productCount: 678 },
        ],
      },
      {
        id: "dogs",
        name: "Собаки",
        slug: "dogs",
        productCount: 6120,
        children: [
          { id: "dog-food", name: "Корма", slug: "dog-food", productCount: 1580 },
          { id: "dog-accessories", name: "Аксессуары", slug: "dog-accessories", productCount: 1120 },
          { id: "dog-health", name: "Здоровье", slug: "dog-health", productCount: 567 },
        ],
      },
      {
        id: "small-pets",
        name: "Мелкие животные",
        slug: "small-pets",
        productCount: 2340,
      },
      {
        id: "birds",
        name: "Птицы",
        slug: "birds",
        productCount: 1730,
      },
    ],
  },
  {
    id: "home",
    name: "Уют и Дом",
    icon: Home,
    productCount: 23150,
    children: [
      { id: "decor", name: "Декор", slug: "decor", productCount: 4560 },
      { id: "textiles", name: "Текстиль", slug: "textiles", productCount: 3890 },
      { id: "candles", name: "Свечи и ароматы", slug: "candles", productCount: 2340 },
      { id: "cleaning", name: "Эко-химия", slug: "cleaning", productCount: 1890 },
      { id: "kitchen", name: "Кухня", slug: "kitchen", productCount: 5670 },
    ],
  },
  {
    id: "garden",
    name: "Сад и Огород",
    icon: Flower2,
    productCount: 12890,
    children: [
      { id: "seeds", name: "Семена", slug: "seeds", productCount: 3450 },
      { id: "plants", name: "Саженцы", slug: "plants", productCount: 2890 },
      { id: "tools", name: "Инструменты", slug: "tools", productCount: 1560 },
      { id: "fertilizers", name: "Удобрения", slug: "fertilizers", productCount: 890 },
      { id: "pots", name: "Горшки и кашпо", slug: "pots", productCount: 2340 },
    ],
  },
];

const CategoryItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors border-b border-border ${
          level > 0 ? "pl-" + (level * 6 + 3) : ""
        }`}
        style={{ paddingLeft: level * 24 + 12 }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        {hasChildren ? (
          <button onClick={() => setIsOpen(!isOpen)} className="p-1">
            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <div className="w-6" />
        )}
        <span className="flex-1 font-medium text-sm">{category.name}</span>
        <Badge variant="outline" className="text-xs">
          {category.productCount.toLocaleString()}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              Просмотр
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Plus className="h-4 w-4 mr-2" />
              Добавить подкатегорию
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {hasChildren && isOpen && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminCategories = () => {
  return (
    <>
      <Helmet>
        <title>Категории — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Категории" description="Управление структурой каталога">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск категорий..." className="pl-10" />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить категорию
          </Button>
        </div>

        {/* Categories Tree */}
        <div className="grid lg:grid-cols-3 gap-6">
          {categories.map((mainCategory) => {
            const Icon = mainCategory.icon;
            return (
              <Card key={mainCategory.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      {mainCategory.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {mainCategory.productCount.toLocaleString()} товаров
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border-t border-border">
                    {mainCategory.children.map((category) => (
                      <CategoryItem key={category.id} category={category} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminCategories;
