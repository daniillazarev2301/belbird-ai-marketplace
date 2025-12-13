import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X, Navigation, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  provider: string;
  workTime?: string;
  phone?: string;
}

interface PickupPointMapProps {
  provider: string;
  city: string;
  onSelect: (point: PickupPoint) => void;
  selectedPoint?: PickupPoint | null;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const PickupPointMap = ({ provider, city, onSelect, selectedPoint }: PickupPointMapProps) => {
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const providerNames: Record<string, string> = {
    cdek: "СДЭК",
    boxberry: "Boxberry",
    russian_post: "Почта России",
  };

  // Load Yandex Maps API
  useEffect(() => {
    if (window.ymaps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU";
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => setMapLoaded(true));
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Fetch pickup points
  const fetchPickupPoints = useCallback(async () => {
    if (!city || !provider) return;

    setLoading(true);
    try {
      // Simulate pickup points - in production, call provider APIs
      const mockPoints: PickupPoint[] = generateMockPoints(provider, city);
      setPoints(mockPoints);
      setFilteredPoints(mockPoints);
    } catch (err) {
      console.error("Error fetching pickup points:", err);
    } finally {
      setLoading(false);
    }
  }, [city, provider]);

  useEffect(() => {
    if (open && city && provider) {
      fetchPickupPoints();
    }
  }, [open, city, provider, fetchPickupPoints]);

  // Initialize map
  useEffect(() => {
    if (!open || !mapLoaded || !mapRef.current || points.length === 0) return;

    // Clear previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
    }

    window.ymaps.ready(() => {
      const centerPoint = points[0];
      
      mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
        center: [centerPoint.lat, centerPoint.lng],
        zoom: 12,
        controls: ["zoomControl", "geolocationControl"],
      });

      // Add markers
      markersRef.current = [];
      points.forEach((point) => {
        const placemark = new window.ymaps.Placemark(
          [point.lat, point.lng],
          {
            balloonContentHeader: point.name,
            balloonContentBody: `
              <p>${point.address}</p>
              ${point.workTime ? `<p>Режим работы: ${point.workTime}</p>` : ""}
              ${point.phone ? `<p>Тел: ${point.phone}</p>` : ""}
            `,
            hintContent: point.name,
          },
          {
            preset: getMarkerPreset(point.provider),
          }
        );

        placemark.events.add("click", () => {
          handlePointSelect(point);
        });

        mapInstanceRef.current.geoObjects.add(placemark);
        markersRef.current.push(placemark);
      });

      // Fit bounds to show all markers
      if (points.length > 1) {
        mapInstanceRef.current.setBounds(
          mapInstanceRef.current.geoObjects.getBounds(),
          { checkZoomRange: true, zoomMargin: 30 }
        );
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [open, mapLoaded, points]);

  const getMarkerPreset = (provider: string) => {
    switch (provider) {
      case "cdek":
        return "islands#greenDotIcon";
      case "boxberry":
        return "islands#orangeDotIcon";
      case "russian_post":
        return "islands#blueDotIcon";
      default:
        return "islands#redDotIcon";
    }
  };

  const handlePointSelect = (point: PickupPoint) => {
    onSelect(point);
    setOpen(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPoints(points);
    } else {
      const filtered = points.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.address.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPoints(filtered);
    }
  };

  const focusOnPoint = (point: PickupPoint) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([point.lat, point.lng], 16, {
        duration: 300,
      });
    }
  };

  return (
    <div className="space-y-2">
      {selectedPoint ? (
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-primary/5 border-primary">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">{selectedPoint.name}</p>
            <p className="text-sm text-muted-foreground">{selectedPoint.address}</p>
            {selectedPoint.workTime && (
              <p className="text-xs text-muted-foreground mt-1">{selectedPoint.workTime}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => onSelect(null as any)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <MapPin className="h-4 w-4" />
              Выбрать пункт выдачи {providerNames[provider] || provider}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Пункты выдачи {providerNames[provider]} в г. {city}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-1 min-h-0 p-4 pt-2 gap-4">
              {/* List */}
              <div className="w-80 flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по адресу..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredPoints.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Пункты выдачи не найдены
                    </p>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {filteredPoints.map((point) => (
                        <div
                          key={point.id}
                          className="p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors group"
                          onClick={() => handlePointSelect(point)}
                          onMouseEnter={() => focusOnPoint(point)}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">{point.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {point.address}
                              </p>
                              {point.workTime && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {point.workTime}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Map */}
              <div className="flex-1 rounded-lg overflow-hidden border bg-muted">
                {!mapLoaded ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div ref={mapRef} className="w-full h-full" />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Mock data generator - in production, call actual provider APIs
function generateMockPoints(provider: string, city: string): PickupPoint[] {
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    "Москва": { lat: 55.7558, lng: 37.6173 },
    "Санкт-Петербург": { lat: 59.9343, lng: 30.3351 },
    "Казань": { lat: 55.7879, lng: 49.1233 },
    "Новосибирск": { lat: 55.0084, lng: 82.9357 },
    "Екатеринбург": { lat: 56.8389, lng: 60.6057 },
  };

  const base = cityCoords[city] || { lat: 55.7558, lng: 37.6173 };
  const providerName = provider === "cdek" ? "СДЭК" : provider === "boxberry" ? "Boxberry" : "Почта России";

  return Array.from({ length: 15 }, (_, i) => ({
    id: `${provider}-${i + 1}`,
    name: `${providerName} №${i + 1}`,
    address: `г. ${city}, ул. ${getRandomStreet()}, д. ${Math.floor(Math.random() * 150) + 1}`,
    city,
    lat: base.lat + (Math.random() - 0.5) * 0.1,
    lng: base.lng + (Math.random() - 0.5) * 0.15,
    provider,
    workTime: getRandomWorkTime(),
    phone: `+7 (${800 + Math.floor(Math.random() * 100)}) ${String(Math.floor(Math.random() * 10000000)).padStart(7, "0")}`,
  }));
}

function getRandomStreet(): string {
  const streets = [
    "Ленина", "Пушкина", "Гагарина", "Мира", "Советская", 
    "Центральная", "Московская", "Октябрьская", "Победы", "Комсомольская",
    "Садовая", "Лесная", "Новая", "Школьная", "Молодежная"
  ];
  return streets[Math.floor(Math.random() * streets.length)];
}

function getRandomWorkTime(): string {
  const options = [
    "Пн-Пт: 10:00-20:00, Сб-Вс: 10:00-18:00",
    "Ежедневно: 09:00-21:00",
    "Пн-Вс: 10:00-22:00",
    "Пн-Сб: 09:00-19:00",
    "Круглосуточно",
  ];
  return options[Math.floor(Math.random() * options.length)];
}

export default PickupPointMap;
