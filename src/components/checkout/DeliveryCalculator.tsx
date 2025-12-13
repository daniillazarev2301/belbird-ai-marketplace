import { useState, useEffect } from "react";
import { MapPin, Clock, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface DeliveryOption {
  provider: string;
  name: string;
  price: number;
  days_min: number;
  days_max: number;
  tariff_code?: string;
  tariff_name?: string;
  free_threshold?: number;
  is_fallback?: boolean;
}

interface DeliveryCalculatorProps {
  city: string;
  onCityChange: (city: string) => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  onPriceChange: (price: number) => void;
  cartTotal: number;
  totalWeight?: number;
}

const DeliveryCalculator = ({
  city,
  onCityChange,
  selectedProvider,
  onProviderChange,
  onPriceChange,
  cartTotal,
  totalWeight = 1,
}: DeliveryCalculatorProps) => {
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [inputCity, setInputCity] = useState(city);

  const calculateDelivery = async (targetCity: string) => {
    if (!targetCity.trim()) return;

    setLoading(true);
    setError(null);
    setApiErrors([]);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("delivery-calculate", {
        body: {
          fromCity: "Москва",
          toCity: targetCity,
          weight: totalWeight,
          declaredValue: cartTotal,
        },
      });

      if (invokeError) throw invokeError;

      if (data.results && data.results.length > 0) {
        // Apply free shipping threshold
        const processedOptions = data.results.map((opt: DeliveryOption) => ({
          ...opt,
          price: opt.free_threshold && cartTotal >= opt.free_threshold ? 0 : opt.price,
        }));
        
        setOptions(processedOptions);
        
        // Auto-select cheapest if no provider selected
        if (!selectedProvider || !processedOptions.find((o: DeliveryOption) => o.provider === selectedProvider)) {
          const cheapest = processedOptions[0];
          onProviderChange(cheapest.provider);
          onPriceChange(cheapest.price);
        } else {
          const selected = processedOptions.find((o: DeliveryOption) => o.provider === selectedProvider);
          if (selected) {
            onPriceChange(selected.price);
          }
        }
      }

      if (data.errors) {
        setApiErrors(data.errors);
      }
    } catch (err) {
      console.error("Delivery calculation error:", err);
      setError("Не удалось рассчитать доставку. Используются базовые тарифы.");
      
      // Fallback to static options
      const fallbackOptions: DeliveryOption[] = [
        { provider: "cdek", name: "СДЭК", price: 350, days_min: 2, days_max: 4, is_fallback: true },
        { provider: "boxberry", name: "Boxberry", price: 290, days_min: 3, days_max: 5, is_fallback: true },
        { provider: "russian_post", name: "Почта России", price: 250, days_min: 5, days_max: 10, is_fallback: true },
      ];
      setOptions(fallbackOptions);
      
      if (!selectedProvider) {
        onProviderChange("boxberry");
        onPriceChange(290);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (city) {
      calculateDelivery(city);
    }
  }, [city, cartTotal]);

  const handleCityBlur = () => {
    if (inputCity !== city) {
      onCityChange(inputCity);
    }
  };

  const handleCityKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (inputCity !== city) {
        onCityChange(inputCity);
      }
    }
  };

  const handleProviderSelect = (provider: string) => {
    onProviderChange(provider);
    const selected = options.find(o => o.provider === provider);
    if (selected) {
      onPriceChange(selected.price);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Город доставки</h3>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="delivery-city" className="sr-only">Город</Label>
          <Input
            id="delivery-city"
            placeholder="Введите город"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            onBlur={handleCityBlur}
            onKeyPress={handleCityKeyPress}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => calculateDelivery(inputCity)}
          disabled={loading || !inputCity}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Расчёт стоимости...</span>
        </div>
      ) : options.length > 0 ? (
        <RadioGroup value={selectedProvider} onValueChange={handleProviderSelect}>
          {options.map((option) => (
            <div
              key={option.provider}
              className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedProvider === option.provider
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => handleProviderSelect(option.provider)}
            >
              <RadioGroupItem value={option.provider} id={`delivery-${option.provider}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {option.days_min === option.days_max
                      ? `${option.days_min} дн.`
                      : `${option.days_min}-${option.days_max} дн.`}
                  </Badge>
                  {option.is_fallback && (
                    <Badge variant="outline" className="text-xs">
                      базовый тариф
                    </Badge>
                  )}
                </div>
                {option.tariff_name && (
                  <p className="text-sm text-muted-foreground">{option.tariff_name}</p>
                )}
                {option.free_threshold && cartTotal < option.free_threshold && (
                  <p className="text-xs text-green-600">
                    Бесплатно от {option.free_threshold.toLocaleString()} ₽
                  </p>
                )}
              </div>
              <span className="font-bold">
                {option.price === 0 ? (
                  <span className="text-green-600">Бесплатно</span>
                ) : (
                  `${option.price.toLocaleString()} ₽`
                )}
              </span>
            </div>
          ))}
        </RadioGroup>
      ) : !loading && city && (
        <p className="text-muted-foreground text-sm text-center py-4">
          Введите город для расчёта стоимости доставки
        </p>
      )}

      {apiErrors.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p>Некоторые службы недоступны:</p>
          <ul className="list-disc list-inside">
            {apiErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DeliveryCalculator;
