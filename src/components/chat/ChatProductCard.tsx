import { ShoppingCart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ChatProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    old_price?: number | null;
    images?: string[] | null;
    description?: string | null;
  };
}

const ChatProductCard = ({ product }: ChatProductCardProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "/placeholder.svg",
      quantity: 1,
      slug: product.slug,
    });
    toast({
      title: "Добавлено в корзину",
      description: product.name,
    });
  };

  const discount = product.old_price 
    ? Math.round((1 - product.price / product.old_price) * 100) 
    : 0;

  return (
    <div className="flex gap-3 p-3 bg-background rounded-xl border border-border/50 shadow-sm my-2">
      {/* Product Image */}
      <Link to={`/product/${product.slug}`} className="flex-shrink-0">
        <img
          src={product.images?.[0] || "/placeholder.svg"}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover hover:opacity-90 transition-opacity"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link 
          to={`/product/${product.slug}`}
          className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors"
        >
          {product.name}
        </Link>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-primary">
            {product.price.toLocaleString()} ₽
          </span>
          {product.old_price && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {product.old_price.toLocaleString()} ₽
              </span>
              <span className="text-xs text-green-600 font-medium">
                -{discount}%
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleAddToCart}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <ShoppingCart className="h-3 w-3" />
            В корзину
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-7 text-xs px-2.5 gap-1"
          >
            <Link to={`/product/${product.slug}`}>
              <ExternalLink className="h-3 w-3" />
              Подробнее
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatProductCard;
