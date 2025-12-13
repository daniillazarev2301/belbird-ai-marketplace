import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, Eye, Tag, ArrowRight, Search, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const Blog = () => {
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
        <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Блог BelBird
            </h1>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
              Полезные статьи о питомцах, доме и саде от наших экспертов
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск статей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="border-b">
            <div className="container py-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Все статьи
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section className="container py-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Статьи не найдены" : "Пока нет опубликованных статей"}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article 
                  key={post.id} 
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                  itemScope 
                  itemType="https://schema.org/BlogPosting"
                >
                  {post.cover_image && (
                    <Link to={`/blog/${post.slug}`} className="block aspect-video overflow-hidden">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        itemProp="image"
                        loading="lazy"
                      />
                    </Link>
                  )}
                  
                  <div className="p-5">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      {post.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span itemProp="articleSection">{post.category}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <time 
                          dateTime={post.published_at || post.created_at}
                          itemProp="datePublished"
                        >
                          {format(
                            new Date(post.published_at || post.created_at), 
                            "d MMMM yyyy", 
                            { locale: ru }
                          )}
                        </time>
                      </span>
                      {post.views_count !== null && post.views_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views_count}
                        </span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h2 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      <Link to={`/blog/${post.slug}`} itemProp="headline">
                        {post.title}
                      </Link>
                    </h2>
                    
                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4" itemProp="description">
                        {post.excerpt}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Read More */}
                    <Link 
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Читать далее
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Blog;
