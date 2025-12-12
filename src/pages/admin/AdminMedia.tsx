import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Upload,
  FolderPlus,
  Grid,
  List,
  MoreHorizontal,
  Image,
  Video,
  Box,
  Trash2,
  Download,
  Eye,
  Copy,
} from "lucide-react";

const mediaFiles = [
  {
    id: "1",
    name: "royal-canin-main.jpg",
    type: "image",
    size: "245 KB",
    dimensions: "800x800",
    url: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop",
    product: "Royal Canin Indoor",
  },
  {
    id: "2",
    name: "pet-bed-xl.jpg",
    type: "image",
    size: "312 KB",
    dimensions: "800x800",
    url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    product: "Лежанка Premium XL",
  },
  {
    id: "3",
    name: "tomato-seeds.jpg",
    type: "image",
    size: "189 KB",
    dimensions: "800x800",
    url: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=200&h=200&fit=crop",
    product: "Семена томатов",
  },
  {
    id: "4",
    name: "candle-aroma.jpg",
    type: "image",
    size: "256 KB",
    dimensions: "800x800",
    url: "https://images.unsplash.com/photo-1602607550528-80baf3b9c38a?w=200&h=200&fit=crop",
    product: "Свеча ароматическая",
  },
  {
    id: "5",
    name: "monstera-plant.jpg",
    type: "image",
    size: "298 KB",
    dimensions: "800x800",
    url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&h=200&fit=crop",
    product: "Монстера",
  },
  {
    id: "6",
    name: "product-review.mp4",
    type: "video",
    size: "12.5 MB",
    dimensions: "1920x1080",
    url: "",
    product: "Royal Canin Indoor",
  },
  {
    id: "7",
    name: "pet-bed-3d.glb",
    type: "3d",
    size: "4.2 MB",
    dimensions: "-",
    url: "",
    product: "Лежанка Premium XL",
  },
  {
    id: "8",
    name: "garden-tools.jpg",
    type: "image",
    size: "267 KB",
    dimensions: "800x800",
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop",
    product: "Секатор садовый",
  },
];

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  image: { label: "Изображение", icon: Image, color: "text-primary" },
  video: { label: "Видео", icon: Video, color: "text-secondary" },
  "3d": { label: "3D модель", icon: Box, color: "text-muted-foreground" },
};

const AdminMedia = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleFile = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const stats = {
    total: mediaFiles.length,
    images: mediaFiles.filter((f) => f.type === "image").length,
    videos: mediaFiles.filter((f) => f.type === "video").length,
    models: mediaFiles.filter((f) => f.type === "3d").length,
  };

  return (
    <>
      <Helmet>
        <title>Медиа-центр — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Медиа-центр" description="Управление изображениями, видео и 3D-моделями">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Image className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Всего файлов</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Image className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.images}</p>
                <p className="text-xs text-muted-foreground">Изображений</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Video className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.videos}</p>
                <p className="text-xs text-muted-foreground">Видео</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Box className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.models}</p>
                <p className="text-xs text-muted-foreground">3D-моделей</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск файлов..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="image">Изображения</SelectItem>
                <SelectItem value="video">Видео</SelectItem>
                <SelectItem value="3d">3D-модели</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Папка
            </Button>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Загрузить
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Выбрано: {selectedFiles.length}</span>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-3 w-3" />
              Скачать
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-destructive">
              <Trash2 className="h-3 w-3" />
              Удалить
            </Button>
          </div>
        )}

        {/* Files Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaFiles.map((file) => {
              const TypeIcon = typeConfig[file.type].icon;
              return (
                <div
                  key={file.id}
                  className={`group relative bg-card rounded-lg border border-border overflow-hidden hover:border-primary transition-colors ${
                    selectedFiles.includes(file.id) ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={() => toggleFile(file.id)}
                    />
                  </div>

                  {/* Preview */}
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {file.type === "image" && file.url ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <TypeIcon className={`h-12 w-12 ${typeConfig[file.type].color}`} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Копировать URL
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Скачать
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {mediaFiles.map((file) => {
              const TypeIcon = typeConfig[file.type].icon;
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={() => toggleFile(file.id)}
                  />
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {file.type === "image" && file.url ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <TypeIcon className={`h-6 w-6 ${typeConfig[file.type].color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.product}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {typeConfig[file.type].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground w-20">{file.size}</span>
                  <span className="text-sm text-muted-foreground w-24">{file.dimensions}</span>
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
                        <Download className="h-4 w-4 mr-2" />
                        Скачать
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default AdminMedia;
