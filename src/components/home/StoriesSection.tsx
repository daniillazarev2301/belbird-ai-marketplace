import { Play, X, ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  product_id: string | null;
  category_id: string | null;
  is_active: boolean;
  views_count: number;
  sort_order: number;
}

const StoryItem = ({ story, onClick }: { story: Story; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 shrink-0 group"
  >
    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full p-0.5 bg-gradient-to-br from-secondary via-primary to-secondary">
      <div className="w-full h-full rounded-full overflow-hidden bg-background p-0.5">
        <img
          src={story.thumbnail_url || "/placeholder.svg"}
          alt={story.title}
          className="w-full h-full rounded-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
        </div>
      </div>
    </div>
    <span className="text-xs text-center max-w-[72px] md:max-w-[80px] truncate">
      {story.title}
    </span>
  </button>
);

const StoriesSection = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["belbird-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as Story[];
    },
  });

  const selectedStory = selectedIndex !== null ? stories[selectedIndex] : null;

  useEffect(() => {
    if (videoRef.current && selectedStory) {
      videoRef.current.play();
    }
  }, [selectedStory]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(prog);
    }
  };

  const handleVideoEnd = () => {
    if (selectedIndex !== null && selectedIndex < stories.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setProgress(0);
    } else {
      setSelectedIndex(null);
    }
  };

  const goToPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < stories.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setProgress(0);
    } else {
      setSelectedIndex(null);
    }
  };


  useEffect(() => {
    if (selectedStory) {
      supabase
        .from("stories")
        .update({ views_count: selectedStory.views_count + 1 })
        .eq("id", selectedStory.id)
        .then(() => {});
    }
  }, [selectedStory?.id]);

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
          {stories.map((story, index) => (
            <StoryItem
              key={story.id}
              story={story}
              onClick={() => setSelectedIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Full Screen Story Viewer */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-foreground h-[90vh] max-h-[800px]">
          {selectedStory && (
            <div className="relative w-full h-full">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                {stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-0.5 bg-primary-foreground/30 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-primary-foreground transition-all",
                        idx < (selectedIndex || 0) ? "w-full" : idx === selectedIndex ? "" : "w-0"
                      )}
                      style={{ width: idx === selectedIndex ? `${progress}%` : undefined }}
                    />
                  </div>
                ))}
              </div>

              {/* Video */}
              <video
                ref={videoRef}
                src={selectedStory.video_url}
                className="w-full h-full object-cover"
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
              />

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-foreground">
                    <img
                      src={selectedStory.thumbnail_url || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-foreground">BelBird</p>
                    <p className="text-xs text-primary-foreground/70">{selectedStory.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setSelectedIndex(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Navigation Zones */}
              <button
                className="absolute left-0 top-0 w-1/3 h-full"
                onClick={goToPrev}
              />
              <button
                className="absolute right-0 top-0 w-1/3 h-full"
                onClick={goToNext}
              />

              {/* CTA */}
              {selectedStory.product_id && (
                <div className="absolute bottom-4 left-4 right-4">
                  <a
                    href={`/product/${selectedStory.product_id}`}
                    onClick={() => setSelectedIndex(null)}
                    className="block w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-center"
                  >
                    Смотреть товар
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default StoriesSection;