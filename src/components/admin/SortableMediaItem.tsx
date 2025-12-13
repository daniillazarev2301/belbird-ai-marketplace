import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Star, X, Video, GripVertical, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableMediaItemProps {
  id: string;
  url: string;
  index: number;
  isVideo: boolean;
  onRemove: (url: string) => void;
  onSetMain: (url: string) => void;
}

export const SortableMediaItem = ({
  id,
  url,
  index,
  isVideo,
  onRemove,
  onSetMain,
}: SortableMediaItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square bg-muted rounded-lg overflow-hidden",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      {isVideo ? (
        <div className="relative w-full h-full">
          <video
            src={url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center group-hover:opacity-0 transition-opacity">
              <Play className="h-3 w-3 fill-current" />
            </div>
          </div>
        </div>
      ) : (
        <img
          src={url}
          alt={`Media ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Media type badge */}
      {isVideo && (
        <div className="absolute top-1 left-1">
          <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded flex items-center gap-1">
            <Video className="h-3 w-3" />
          </span>
        </div>
      )}

      {/* Main badge */}
      {index === 0 && (
        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded flex items-center gap-1">
          <Star className="h-3 w-3" />
          Главное
        </span>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="p-1 rounded bg-background/80 backdrop-blur-sm">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {index !== 0 && (
          <button
            onClick={() => onSetMain(url)}
            className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Сделать главным"
          >
            <Star className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => onRemove(url)}
          className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          title="Удалить"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
