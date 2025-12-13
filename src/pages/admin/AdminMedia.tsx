import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Upload,
  Grid,
  List,
  MoreHorizontal,
  Image,
  Video,
  Trash2,
  Download,
  Eye,
  Copy,
  Loader2,
  RefreshCw,
  CheckCheck,
  HardDrive,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { compressMultipleImages, formatFileSize } from "@/utils/imageCompression";

interface StorageFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  size: number;
  url: string;
  created_at: string;
  bucket: string;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  image: { label: "Изображение", icon: Image, color: "text-primary" },
  video: { label: "Видео", icon: Video, color: "text-blue-500" },
};

const AdminMedia = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Fetch files from storage buckets
  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-media", searchQuery, typeFilter],
    queryFn: async () => {
      const allFiles: StorageFile[] = [];
      
      // Get files from products bucket
      const { data: productFiles, error: productError } = await supabase.storage
        .from('products')
        .list('product-images', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      
      if (!productError && productFiles) {
        for (const file of productFiles) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`product-images/${file.name}`);
          allFiles.push({
            id: file.id || file.name,
            name: file.name,
            type: 'image',
            size: file.metadata?.size || 0,
            url: publicUrl,
            created_at: file.created_at || new Date().toISOString(),
            bucket: 'products',
          });
        }
      }

      // Get videos from products bucket
      const { data: videoFiles, error: videoError } = await supabase.storage
        .from('products')
        .list('product-videos', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      
      if (!videoError && videoFiles) {
        for (const file of videoFiles) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`product-videos/${file.name}`);
          allFiles.push({
            id: file.id || file.name,
            name: file.name,
            type: 'video',
            size: file.metadata?.size || 0,
            url: publicUrl,
            created_at: file.created_at || new Date().toISOString(),
            bucket: 'products',
          });
        }
      }

      // Get files from site-assets bucket
      const folders = ['blog', 'logos', 'banners'];
      for (const folder of folders) {
        const { data: assetFiles, error: assetError } = await supabase.storage
          .from('site-assets')
          .list(folder, { limit: 100 });
        
        if (!assetError && assetFiles) {
          for (const file of assetFiles) {
            if (file.name === '.emptyFolderPlaceholder') continue;
            const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(`${folder}/${file.name}`);
            const isVideo = file.name.match(/\.(mp4|webm|gif)$/i);
            allFiles.push({
              id: file.id || `${folder}-${file.name}`,
              name: file.name,
              type: isVideo ? 'video' : 'image',
              size: file.metadata?.size || 0,
              url: publicUrl,
              created_at: file.created_at || new Date().toISOString(),
              bucket: 'site-assets',
            });
          }
        }
      }

      // Apply filters
      let filtered = allFiles;
      
      if (searchQuery) {
        filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      if (typeFilter !== 'all') {
        filtered = filtered.filter(f => f.type === typeFilter);
      }

      return filtered;
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (file: StorageFile) => {
      const folderPath = file.type === 'video' ? 'product-videos' : 'product-images';
      const { error } = await supabase.storage.from(file.bucket).remove([`${folderPath}/${file.name}`]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("Файл удалён");
    },
    onError: (error: Error) => {
      toast.error("Ошибка удаления: " + error.message);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
      const videoFiles = fileArray.filter(f => f.type.startsWith('video/'));

      // Compress images
      let processedImages: File[] = [];
      if (imageFiles.length > 0) {
        processedImages = await compressMultipleImages(
          imageFiles,
          { maxSizeMB: 1, maxWidthOrHeight: 1920 },
          (completed, total) => setUploadProgress((completed / total) * 50)
        );
      }

      const allFiles = [...processedImages, ...videoFiles];
      let uploaded = 0;

      for (const file of allFiles) {
        const isVideo = file.type.startsWith('video/');
        const folder = isVideo ? 'product-videos' : 'product-images';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;

        const { error } = await supabase.storage
          .from('products')
          .upload(`${folder}/${fileName}`, file);

        if (error) {
          toast.error(`Ошибка загрузки ${file.name}`);
          continue;
        }
        uploaded++;
        setUploadProgress(50 + (uploaded / allFiles.length) * 50);
      }

      toast.success(`Загружено ${uploaded} файлов`);
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Ошибка загрузки");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.length === 0) return;
    const filesToDelete = files.filter(f => selectedFiles.includes(f.id));
    filesToDelete.forEach(f => deleteFileMutation.mutate(f));
    setSelectedFiles([]);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success("URL скопирован");
  };

  const toggleFile = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const stats = {
    total: files.length,
    images: files.filter((f) => f.type === "image").length,
    videos: files.filter((f) => f.type === "video").length,
    totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
  };

  return (
    <>
      <Helmet>
        <title>Медиа-центр — BelBird Admin</title>
      </Helmet>
      <AdminLayout 
        title="Медиа-центр" 
        description="Централизованное хранилище всех изображений и видео магазина. Управляйте файлами товаров, блога и сайта."
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
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
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Video className="h-5 w-5 text-blue-500" />
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
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">Общий размер</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Поиск файлов..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="image">Изображения</SelectItem>
                <SelectItem value="video">Видео</SelectItem>
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
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <label>
              <Button className="gap-2 cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Загрузить
                </span>
              </Button>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Загрузка и сжатие файлов...</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Выбрано: {selectedFiles.length}</span>
            <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={handleDeleteSelected}>
              <Trash2 className="h-3 w-3" />
              Удалить
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Image className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">Нет загруженных файлов</p>
            <p className="text-sm text-muted-foreground mb-4">
              Загрузите изображения и видео для товаров, блога или баннеров
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file) => {
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
                  <div 
                    className="aspect-square bg-muted flex items-center justify-center cursor-pointer"
                    onClick={() => setPreviewFile(file)}
                  >
                    {file.type === "image" ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : file.type === "video" ? (
                      <video 
                        src={file.url} 
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                    ) : (
                      <TypeIcon className={`h-12 w-12 ${typeConfig[file.type].color}`} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
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
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyUrl(file.url)}>
                          {copiedUrl === file.url ? (
                            <CheckCheck className="h-4 w-4 mr-2 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Копировать URL
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={file.url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Скачать
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteFileMutation.mutate(file)}
                        >
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
            {files.map((file) => {
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
                  <div 
                    className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => setPreviewFile(file)}
                  >
                    {file.type === "image" ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <TypeIcon className={`h-6 w-6 ${typeConfig[file.type].color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.bucket}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {typeConfig[file.type].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground w-20">{formatFileSize(file.size)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотр
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyUrl(file.url)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Копировать URL
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={file.url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Скачать
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteFileMutation.mutate(file)}
                      >
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

        {/* Preview Dialog */}
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewFile?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              {previewFile?.type === 'image' ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-h-[70vh] object-contain rounded-lg" />
              ) : previewFile?.type === 'video' ? (
                <video src={previewFile.url} controls className="max-h-[70vh] rounded-lg" />
              ) : null}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => copyUrl(previewFile?.url || '')}>
                  <Copy className="h-4 w-4 mr-2" />
                  Копировать URL
                </Button>
                <Button variant="outline" asChild>
                  <a href={previewFile?.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Скачать
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminMedia;