import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GitCompare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_COMPARE_ITEMS = 4;
const STORAGE_KEY = "compare_products";

interface CompareButtonProps {
  productId: string;
  productName: string;
  variant?: "default" | "icon";
}

export const CompareButton = ({ productId, productName, variant = "default" }: CompareButtonProps) => {
  const [isInCompare, setIsInCompare] = useState(false);

  useEffect(() => {
    const items = getCompareItems();
    setIsInCompare(items.includes(productId));
  }, [productId]);

  const getCompareItems = (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveCompareItems = (items: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("compare-updated"));
  };

  const toggleCompare = () => {
    const items = getCompareItems();

    if (isInCompare) {
      const newItems = items.filter((id) => id !== productId);
      saveCompareItems(newItems);
      setIsInCompare(false);
      toast.success("Товар убран из сравнения");
    } else {
      if (items.length >= MAX_COMPARE_ITEMS) {
        toast.error(`Максимум ${MAX_COMPARE_ITEMS} товара для сравнения`);
        return;
      }
      const newItems = [...items, productId];
      saveCompareItems(newItems);
      setIsInCompare(true);
      toast.success("Товар добавлен в сравнение");
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCompare}
        className={cn(isInCompare && "text-primary")}
      >
        <GitCompare className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleCompare}
      className={cn("gap-2", isInCompare && "border-primary text-primary")}
    >
      <GitCompare className="h-4 w-4" />
      {isInCompare ? "В сравнении" : "Сравнить"}
    </Button>
  );
};

// Hook to get compare items count
export const useCompareCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const items = stored ? JSON.parse(stored) : [];
        setCount(items.length);
      } catch {
        setCount(0);
      }
    };

    updateCount();
    window.addEventListener("compare-updated", updateCount);
    return () => window.removeEventListener("compare-updated", updateCount);
  }, []);

  return count;
};
