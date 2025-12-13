import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, Eye, Tag, ArrowRight, Search, Loader2, BookOpen, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  views_count: number | null;
  published_at: string | null;
  created_at: string;
  meta_title: string | null;
  meta_description: string | null;
}

// Estimate reading time
const getReadingTime = (content: string | null): number => {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

const Blog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts", searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Get unique categories
  const categories = [...new Set(posts.filter(p => p.category).map(p => p.category!))];

  // Featured post (first one)
  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  // JSON-LD structured data for blog
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Блог BelBird",
    "description": "Полезные статьи о питомцах, доме и саде от экспертов BelBird",
    "url": window.location.origin + "/blog",
    "publisher": {
      "@type": "Organization",
      "name": "BelBird",
      "logo": {
        "@type": "ImageObject",
        "url": window.location.origin + "/favicon.ico"
      }
    },
    "blogPost": posts.slice(0, 10).map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt || post.meta_description,
      "image": post.cover_image,
      "datePublished": post.published_at || post.created_at,
      "url": `${window.location.origin}/blog/${post.slug}`,
      "author": {
        "@type": "Organization",
        "name": "BelBird"
      }
    }))
  };

  const handlePostClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  return (
    <>
      <Helmet>
        <title>Блог о питомцах, доме и саде | BelBird</title>
        <meta 
          name="description" 
          content="Экспертные статьи о уходе за питомцами, обустройстве дома и работе в саду. Советы от специалистов BelBird." 
        />
        <meta name="keywords" content="блог о питомцах, уход за животными, советы для дома, садоводство, BelBird" />
        <link rel="canonical" href={window.location.origin + "/blog"} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Блог о питомцах, доме и саде | BelBird" />
        <meta property="og:description" content="Экспертные статьи о уходе за питомцами, обустройстве дома и работе в саду." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.origin + "/blog"} />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:site_name" content="BelBird" />
        
        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(blogJsonLd)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="container relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Блог BelBird
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-10">
              Полезные статьи о питомцах, доме и саде от наших экспертов. 
              Советы, лайфхаки и вдохновение для лучшей жизни.
            </p>
            
            {/* Search */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Поиск статей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base rounded-full border-2 focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="border-b bg-card/50">
            <div className="container py-6">
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className="rounded-full"
                >
                  Все статьи
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="container py-12 md:py-16">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                {searchQuery ? "Статьи не найдены" : "Скоро здесь появятся статьи"}
              </h2>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Попробуйте изменить поисковый запрос" 
                  : "Мы готовим для вас интересный контент"}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && !searchQuery && !selectedCategory && (
                <div className="mb-12">
                  <Card 
                    className="overflow-hidden cursor-pointer group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
                    onClick={() => handlePostClick(featuredPost.slug)}
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      {featuredPost.cover_image ? (
                        <div className="aspect-video md:aspect-auto md:h-full overflow-hidden">
                          <img
                            src={featuredPost.cover_image}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video md:aspect-auto md:h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <BookOpen className="h-20 w-20 text-primary/30" />
                        </div>
                      )}
                      <CardContent className="p-6 md:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge variant="default" className="rounded-full">Главная статья</Badge>
                          {featuredPost.category && (
                            <Badge variant="secondary" className="rounded-full">
                              {featuredPost.category}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h2>
                        {featuredPost.excerpt && (
                          <p className="text-muted-foreground text-lg mb-6 line-clamp-3">
                            {featuredPost.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {format(
                              new Date(featuredPost.published_at || featuredPost.created_at), 
                              "d MMMM yyyy", 
                              { locale: ru }
                            )}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {getReadingTime(featuredPost.content)} мин чтения
                          </span>
                          {featuredPost.views_count !== null && featuredPost.views_count > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Eye className="h-4 w-4" />
                              {featuredPost.views_count}
                            </span>
                          )}
                        </div>
                        <Button className="w-fit gap-2 rounded-full">
                          Читать статью
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              )}

              {/* Posts Grid */}
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {(searchQuery || selectedCategory ? posts : regularPosts).map((post) => (
                  <article 
                    key={post.id} 
                    className="group rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/30"
                    onClick={() => handlePostClick(post.slug)}
                    itemScope 
                    itemType="https://schema.org/BlogPosting"
                  >
                    <div className="aspect-video overflow-hidden bg-muted">
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          itemProp="image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <BookOpen className="h-12 w-12 text-primary/30" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 md:p-6">
                      {/* Category & Reading Time */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {post.category && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {post.category}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getReadingTime(post.content)} мин
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h2 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors" itemProp="headline">
                        {post.title}
                      </h2>
                      
                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4" itemProp="description">
                          {post.excerpt}
                        </p>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <time 
                          dateTime={post.published_at || post.created_at}
                          itemProp="datePublished"
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          {format(
                            new Date(post.published_at || post.created_at), 
                            "d MMM yyyy", 
                            { locale: ru }
                          )}
                        </time>
                        {post.views_count !== null && post.views_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            {post.views_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Tags Cloud */}
              {posts.length > 0 && (
                <div className="mt-16 pt-12 border-t">
                  <h3 className="text-lg font-semibold text-center mb-6">Популярные теги</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[...new Set(posts.flatMap(p => p.tags || []))].slice(0, 15).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="rounded-full px-4 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Blog;
