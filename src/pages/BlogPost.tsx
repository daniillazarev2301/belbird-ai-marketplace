import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, Eye, Tag, ArrowLeft, Share2, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });

  // Increment view count
  const incrementViews = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ views_count: (post?.views_count || 0) + 1 })
        .eq("id", postId);
      if (error) throw error;
    },
  });

  useEffect(() => {
    if (post?.id) {
      incrementViews.mutate(post.id);
    }
  }, [post?.id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || "",
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Ссылка скопирована");
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Статья не найдена</h1>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к блогу
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  // JSON-LD for article
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.meta_description,
    "image": post.cover_image,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.published_at || post.created_at,
    "author": {
      "@type": "Organization",
      "name": "BelBird"
    },
    "publisher": {
      "@type": "Organization",
      "name": "BelBird",
      "logo": {
        "@type": "ImageObject",
        "url": window.location.origin + "/favicon.ico"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    },
    "keywords": post.tags?.join(", ")
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Главная",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Блог",
        "item": window.location.origin + "/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": window.location.href
      }
    ]
  };

  const pageTitle = post.meta_title || `${post.title} | Блог BelBird`;
  const pageDescription = post.meta_description || post.excerpt || `Читайте статью "${post.title}" в блоге BelBird`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={post.tags?.join(", ")} />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:site_name" content="BelBird" />
        <meta property="article:published_time" content={post.published_at || post.created_at} />
        {post.category && <meta property="article:section" content={post.category} />}
        {post.tags?.map((tag, i) => (
          <meta key={i} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {post.cover_image && <meta name="twitter:image" content={post.cover_image} />}
        
        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        <article itemScope itemType="https://schema.org/BlogPosting">
          {/* Hero */}
          {post.cover_image && (
            <div className="w-full h-64 md:h-96 overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
                itemProp="image"
              />
            </div>
          )}

          <div className="container max-w-4xl py-8 md:py-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground">Главная</Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-foreground">Блог</Link>
              <span>/</span>
              <span className="text-foreground line-clamp-1">{post.title}</span>
            </nav>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {post.category && (
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span itemProp="articleSection">{post.category}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
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
              {post.views_count !== null && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views_count + 1} просмотров
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-6" itemProp="headline">
              {post.title}
            </h1>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="mb-8" />

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              itemProp="articleBody"
              dangerouslySetInnerHTML={{ 
                __html: post.content?.replace(/\n/g, '<br />') || '' 
              }}
            />

            <Separator className="my-8" />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => navigate("/blog")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Все статьи
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Поделиться
              </Button>
            </div>
          </div>
        </article>
      </main>
      
      <Footer />
    </>
  );
};

export default BlogPostPage;
