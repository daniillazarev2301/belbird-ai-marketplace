import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Eye, Loader2, RefreshCw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  is_published: boolean;
  views_count: number;
  published_at: string | null;
  created_at: string;
}

const AdminBlog = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    category: "",
    tags: "",
    is_published: false,
    meta_title: "",
    meta_description: "",
  });

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-blog", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("blog_posts").insert({
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        excerpt: data.excerpt || null,
        content: data.content || null,
        cover_image: data.cover_image || null,
        category: data.category || null,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
        is_published: data.is_published,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        published_at: data.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Статья создана");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || null,
          content: data.content || null,
          cover_image: data.cover_image || null,
          category: data.category || null,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          is_published: data.is_published,
          meta_title: data.meta_title || null,
          meta_description: data.meta_description || null,
          published_at: data.is_published ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Статья обновлена");
      setDialogOpen(false);
      setEditPost(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Статья удалена");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image: "",
      category: "",
      tags: "",
      is_published: false,
      meta_title: "",
      meta_description: "",
    });
  };

  const openEditDialog = (post: BlogPost) => {
    setEditPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content || "",
      cover_image: post.cover_image || "",
      category: post.category || "",
      tags: post.tags?.join(", ") || "",
      is_published: post.is_published,
      meta_title: "",
      meta_description: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error("Введите заголовок");
      return;
    }

    if (editPost) {
      updatePost.mutate({ id: editPost.id, data: formData });
    } else {
      createPost.mutate(formData);
    }
  };

  return (
    <>
      <Helmet>
        <title>Блог — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Блог" description="Управление статьями блога">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск статей..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                resetForm();
                setEditPost(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Новая статья
            </Button>
          </div>
        </div>

        {/* Posts Table */}
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Статьи не найдены</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать первую статью
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Статья</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Просмотры</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-24">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.cover_image && (
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium line-clamp-1">{post.title}</p>
                          <p className="text-xs text-muted-foreground">/{post.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{post.category || "—"}</TableCell>
                    <TableCell>{post.views_count}</TableCell>
                    <TableCell>
                      <Badge variant={post.is_published ? "default" : "secondary"}>
                        {post.is_published ? "Опубликовано" : "Черновик"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(post.created_at), "d MMM yyyy", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deletePost.mutate(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPost ? "Редактировать статью" : "Новая статья"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Заголовок *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Название статьи"
                />
              </div>
              <div className="space-y-2">
                <Label>URL (slug)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-stati"
                />
              </div>
              <ImageUpload
                label="Обложка"
                value={formData.cover_image}
                onChange={(url) => setFormData({ ...formData, cover_image: url })}
                bucket="site-assets"
                folder="blog"
              />
              <div className="space-y-2">
                <Label>Краткое описание</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Краткое описание статьи"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Содержание</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Текст статьи (поддерживается Markdown)"
                  rows={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Уход за питомцами"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Теги (через запятую)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="собаки, питание, здоровье"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Опубликовать</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSubmit} className="gap-2">
                <Save className="h-4 w-4" />
                {editPost ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminBlog;
