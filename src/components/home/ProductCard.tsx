import { Heart, Star, ShoppingCart, Sparkles, Play } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  category: string;
  slug?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  aiRecommended?: boolean;
}

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
}

const isVideo = (url: string) => {
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.gif') || lower.includes('video');
};

const ProductCard = ({ product, variant = "default" }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { addItem } = useCart();
  
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  // Find first video in images array
  const allMedia = product.images || [product.image];
  const videoUrl = allMedia.find(url => isVideo(url));
  const imageUrl = allMedia.find(url => !isVideo(url)) || product.image;
  const displayMedia = videoUrl || imageUrl;

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, videoUrl]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      quantity: 1,
      image: imageUrl,
      slug: product.slug || product.id,
    });
    toast({
      title: "Добавлено в корзину",
      description: product.name,
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      description: product.name,
    });
  };

  return (
    <article 
      className="group relative bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image/Video Container */}
      <Link to={`/product/${product.slug || product.id}`} className="block relative aspect-square overflow-hidden">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
            />
            {!isHovered && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-4 w-4 fill-current" />
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.aiRecommended && (
            <Badge className="bg-primary/90 text-primary-foreground gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-secondary text-secondary-foreground">
              Новинка
            </Badge>
          )}
          {product.isBestseller && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-orange-500 text-orange-600">
              🔥 Хит
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
            isFavorite
              ? "bg-destructive text-destructive-foreground"
              : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Category */}
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>

        {/* Name */}
        <Link to={`/product/${product.slug || product.id}`}>
          <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price & Action */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-semibold">
              {product.price.toLocaleString()} ₽
            </p>
            {product.oldPrice && (
              <p className="text-sm text-muted-foreground line-through">
                {product.oldPrice.toLocaleString()} ₽
              </p>
            )}
          </div>
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;