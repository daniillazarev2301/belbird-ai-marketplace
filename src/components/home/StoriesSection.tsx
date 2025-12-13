import { Play, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Story {
  id: string;
  title: string;
  thumbnail: string;
  content?: string;
  link?: string;
  isNew?: boolean;
  isViewed?: boolean;
}

const StoryItem = ({ story, onClick }: { story: Story; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 shrink-0"
  >
    <div
      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full p-0.5 ${
        story.isViewed
          ? "bg-muted"
          : story.isNew
          ? "bg-gradient-to-br from-secondary via-primary to-secondary"
          : "bg-gradient-to-br from-primary to-primary/60"
      }`}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-background p-0.5">
        <img
          src={story.thumbnail || "/placeholder.svg"}
          alt={story.title}
          className="w-full h-full rounded-full object-cover"
        />
      </div>
      {story.isNew && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground rounded-full">
          NEW
        </span>
      )}
    </div>
    <span className="text-xs text-center max-w-[72px] md:max-w-[80px] truncate">
      {story.title}
    </span>
  </button>
);

const StoriesSection = () => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // For now, stories can be managed via pages or a dedicated stories table in the future
  // This component will show categories as stories for now
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["home-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, image_url, slug")
        .not("image_url", "is", null)
        .order("sort_order", { ascending: true })
        .limit(8);

      if (error) throw error;

      return (data || []).map((cat, index) => ({
        id: cat.id,
        title: cat.name,
        thumbnail: cat.image_url || "/placeholder.svg",
        link: `/catalog/${cat.slug}`,
        isNew: index === 0,
        isViewed: false,
      })) as Story[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-4 md:py-6 border-b border-border">
        <div className="container px-4 md:px-6">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="py-4 md:py-6 border-b border-border">
      <div className="container px-4 md:px-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Stories from categories */}
          {stories.map((story) => (
            <StoryItem
              key={story.id}
              story={story}
              onClick={() => setSelectedStory(story)}
            />
          ))}
        </div>
      </div>

      {/* Story Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-foreground">
          {selectedStory && (
            <div className="relative aspect-[9/16]">
              <img
                src={selectedStory.thumbnail}
                alt={selectedStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-transparent to-foreground/80" />
              
              {/* Header */}
              <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-foreground">
                  <img
                    src={selectedStory.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-foreground">
                    BelBird
                  </p>
                  <p className="text-xs text-primary-foreground/70">
                    {selectedStory.title}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="absolute bottom-4 left-4 right-4">
                <a 
                  href={selectedStory.link || "/catalog"}
                  onClick={() => setSelectedStory(null)}
                  className="block w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-center"
                >
                  Смотреть товары
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default StoriesSection;