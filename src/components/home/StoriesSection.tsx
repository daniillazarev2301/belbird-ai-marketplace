import { Play, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface StoryProps {
  id: string;
  title: string;
  thumbnail: string;
  isNew?: boolean;
  isViewed?: boolean;
}

const storyData: StoryProps[] = [
  {
    id: "1",
    title: "Новинки недели",
    thumbnail: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=300&fit=crop",
    isNew: true,
  },
  {
    id: "2",
    title: "Уход за кошкой",
    thumbnail: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Идеи декора",
    thumbnail: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=300&fit=crop",
    isViewed: true,
  },
  {
    id: "4",
    title: "Сезон посадки",
    thumbnail: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=300&fit=crop",
  },
  {
    id: "5",
    title: "Лайфхаки",
    thumbnail: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=200&h=300&fit=crop",
  },
  {
    id: "6",
    title: "Обзоры",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=300&fit=crop",
    isViewed: true,
  },
];

const StoryItem = ({ story, onClick }: { story: StoryProps; onClick: () => void }) => (
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
          src={story.thumbnail}
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
  const [selectedStory, setSelectedStory] = useState<StoryProps | null>(null);

  return (
    <section className="py-4 md:py-6 border-b border-border">
      <div className="container px-4 md:px-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add Story Button */}
          <button className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs text-muted-foreground">Создать</span>
          </button>

          {/* Stories */}
          {storyData.map((story) => (
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

              {/* Play Button */}
              <button className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
                  <Play className="h-8 w-8 text-primary-foreground fill-current" />
                </div>
              </button>

              {/* CTA */}
              <div className="absolute bottom-4 left-4 right-4">
                <button 
                  onClick={() => setSelectedStory(null)}
                  className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Смотреть товары
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default StoriesSection;
