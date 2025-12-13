import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Search, Edit, Trash2, Eye, Loader2, RefreshCw, Save, 
  Globe, FileText, Image, Settings2, Calendar, Clock, ExternalLink,
  Copy, CheckCheck
} from "lucide-react";
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
  meta_title: string | null;
  meta_description: string | null;
}

const CATEGORIES = [
  "Питомцы",
  "Уход за питомцами",
  "Здоровье питомцев",
  "Дом и интерьер",
  "Сад и огород",
  "Лайфхаки",
  "Новости",
  "Обзоры товаров",
];

const AdminBlog = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
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
    scheduled_at: "",
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
      const slug = data.slug || data.title
        .toLowerCase()
        .replace(/[а-яё]/g, (char) => {
          const map: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
            'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
          };
          return map[char] || char;
        })
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

      const { error } = await supabase.from("blog_posts").insert({
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content || null,
        cover_image: data.cover_image || null,
        category: data.category || null,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        is_published: data.is_published,
        meta_title: data.meta_title || data.title,
        meta_description: data.meta_description || data.excerpt || null,
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
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          is_published: data.is_published,
          meta_title: data.meta_title || data.title,
          meta_description: data.meta_description || data.excerpt || null,
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

  const togglePublish = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ 
          is_published: isPublished,
          published_at: isPublished ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success(variables.isPublished ? "Статья опубликована" : "Статья снята с публикации");
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
      scheduled_at: "",
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
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      scheduled_at: "",
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

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.success("Ссылка скопирована");
  };

  const publishedCount = posts.filter(p => p.is_published).length;
  const draftCount = posts.filter(p => !p.is_published).length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views_count || 0), 0);

  return (
    <>
      <Helmet>
        <title>Блог — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Блог" description="Управление статьями блога">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{posts.length}</p>
                  <p className="text-xs text-muted-foreground">Всего статей</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Globe className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{publishedCount}</p>
                  <p className="text-xs text-muted-foreground">Опубликовано</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Edit className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{draftCount}</p>
                  <p className="text-xs text-muted-foreground">Черновиков</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalViews}</p>
                  <p className="text-xs text-muted-foreground">Просмотров</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            <Button variant="outline" asChild>
              <a href="/blog" target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Открыть блог
              </a>
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
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
                  <TableHead className="text-center">Просмотры</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-32">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.cover_image ? (
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-14 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded bg-muted flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{post.title}</p>
                          <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.category ? (
                        <Badge variant="outline">{post.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        {post.views_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={post.is_published}
                        onCheckedChange={(checked) => 
                          togglePublish.mutate({ id: post.id, isPublished: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(post.created_at), "d MMM yyyy", { locale: ru })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyUrl(post.slug)}
                        >
                          {copiedSlug === post.slug ? (
                            <CheckCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
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
                          onClick={() => {
                            if (confirm("Удалить статью?")) {
                              deletePost.mutate(post.id);
                            }
                          }}
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
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editPost ? "Редактировать статью" : "Новая статья"}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="content" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Контент
                </TabsTrigger>
                <TabsTrigger value="media" className="gap-2">
                  <Image className="h-4 w-4" />
                  Медиа
                </TabsTrigger>
                <TabsTrigger value="seo" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  SEO
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="content" className="space-y-4 m-0">
                  <div className="grid md:grid-cols-2 gap-4">
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
                        placeholder="avtogeneracija-iz-zagolovka"
                      />
                      <p className="text-xs text-muted-foreground">
                        Оставьте пустым для автоматической генерации
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Краткое описание (анонс)</Label>
                    <Textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Краткое описание статьи для превью в списке"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Содержание статьи</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Текст статьи..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Поддерживается форматирование текста
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Категория</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Теги</Label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="собаки, питание, здоровье"
                      />
                      <p className="text-xs text-muted-foreground">Через запятую</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 m-0">
                  <ImageUpload
                    label="Обложка статьи"
                    value={formData.cover_image}
                    onChange={(url) => setFormData({ ...formData, cover_image: url })}
                    bucket="site-assets"
                    folder="blog"
                  />
                  <p className="text-sm text-muted-foreground">
                    Рекомендуемый размер: 1200x630 пикселей (соотношение 1.91:1)
                  </p>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Поисковая оптимизация
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Meta Title (SEO заголовок)</Label>
                        <Input
                          value={formData.meta_title}
                          onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                          placeholder={formData.title || "Заголовок для поисковых систем"}
                          maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.meta_title.length}/60 символов. Рекомендуется до 60 символов.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Meta Description</Label>
                        <Textarea
                          value={formData.meta_description}
                          onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                          placeholder={formData.excerpt || "Описание для поисковых систем"}
                          rows={3}
                          maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.meta_description.length}/160 символов. Рекомендуется до 160 символов.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-muted-foreground">Предпросмотр в Яндекс</Label>
                        <div className="mt-2 p-4 bg-muted rounded-lg">
                          <p className="text-primary text-base font-medium line-clamp-1">
                            {formData.meta_title || formData.title || "Заголовок статьи"}
                          </p>
                          <p className="text-green-600 text-sm">
                            {window.location.origin}/blog/{formData.slug || "url-stati"}
                          </p>
                          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                            {formData.meta_description || formData.excerpt || "Описание статьи для поисковых систем..."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="publish"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="publish" className="font-medium">
                    {formData.is_published ? "Опубликовать сразу" : "Сохранить как черновик"}
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="gap-2"
                  disabled={createPost.isPending || updatePost.isPending}
                >
                  {(createPost.isPending || updatePost.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editPost ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminBlog;
