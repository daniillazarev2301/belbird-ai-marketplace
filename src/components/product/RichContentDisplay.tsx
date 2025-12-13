import { Check } from "lucide-react";

interface RichContentBlock {
  id: string;
  type: "text" | "image" | "video" | "heading" | "features";
  content: string;
  title?: string;
  items?: string[];
}

interface RichContentDisplayProps {
  blocks: RichContentBlock[];
}

export function RichContentDisplay({ blocks }: RichContentDisplayProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-8 py-6">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={block.id} className="text-xl font-bold">
                {block.content}
              </h2>
            );
          
          case "text":
            return (
              <p key={block.id} className="text-muted-foreground leading-relaxed">
                {block.content}
              </p>
            );
          
          case "image":
            return (
              <div key={block.id} className="rounded-xl overflow-hidden">
                <img 
                  src={block.content} 
                  alt="Product" 
                  className="w-full object-cover"
                />
              </div>
            );
          
          case "video":
            return (
              <div key={block.id} className="aspect-video rounded-xl overflow-hidden bg-muted">
                <iframe
                  src={block.content}
                  title="Product video"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            );
          
          case "features":
            return (
              <div key={block.id} className="bg-muted/50 rounded-xl p-6">
                {block.title && (
                  <h3 className="font-semibold mb-4">{block.title}</h3>
                )}
                <ul className="space-y-3">
                  {block.items?.filter(Boolean).map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
}
