import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Loader2 } from "lucide-react";

const StaticPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace("/", "");

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Simple markdown to HTML converter
  const renderMarkdown = (content: string) => {
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl md:text-3xl font-serif font-semibold mb-6">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ul class="list-disc space-y-1 my-4">$1</ul>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4"><span class="font-medium">$1.</span> $2</li>')
      .replace(/\n\n/g, '</p><p class="text-muted-foreground mb-4">')
      .replace(/^(?!<[hlu])/gm, '')
      .replace(/---/g, '<hr class="my-8 border-border" />');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!page || error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Страница не найдена</h1>
            <p className="text-muted-foreground">Запрашиваемая страница не существует.</p>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.title} — BelBird</title>
        {page.meta_description && (
          <meta name="description" content={page.meta_description} />
        )}
        {page.meta_keywords && (
          <meta name="keywords" content={page.meta_keywords} />
        )}
        <link rel="canonical" href={`https://belbird.ru/${page.slug}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          <div className="container px-4 md:px-6 py-12 md:py-16">
            <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
              <div 
                dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content || "") }}
                className="[&>h1]:text-foreground [&>h2]:text-foreground [&>h3]:text-foreground [&>p]:text-muted-foreground [&>ul]:text-muted-foreground [&>li]:text-muted-foreground"
              />
            </article>
          </div>
        </main>

        <Footer />
        <MobileNav />
      </div>
    </>
  );
};

export default StaticPage;