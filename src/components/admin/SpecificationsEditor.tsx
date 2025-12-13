import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Specification {
  key: string;
  value: string;
}

interface SpecificationsEditorProps {
  specifications: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

const COMMON_SPECS = [
  { key: "Вес", placeholder: "например: 1 кг" },
  { key: "Объём", placeholder: "например: 500 мл" },
  { key: "Размер", placeholder: "например: M" },
  { key: "Цвет", placeholder: "например: Красный" },
  { key: "Материал", placeholder: "например: Натуральная кожа" },
  { key: "Страна производства", placeholder: "например: Россия" },
  { key: "Срок годности", placeholder: "например: 12 месяцев" },
  { key: "Возраст питомца", placeholder: "например: Взрослые (1-7 лет)" },
  { key: "Порода", placeholder: "например: Для всех пород" },
  { key: "Тип корма", placeholder: "например: Сухой" },
];

export function SpecificationsEditor({ specifications, onChange }: SpecificationsEditorProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const specsList = Object.entries(specifications).map(([key, value]) => ({ key, value }));

  const addSpecification = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    onChange({ ...specifications, [newKey.trim()]: newValue.trim() });
    setNewKey("");
    setNewValue("");
  };

  const removeSpecification = (key: string) => {
    const updated = { ...specifications };
    delete updated[key];
    onChange(updated);
  };

  const updateSpecification = (oldKey: string, newKey: string, value: string) => {
    const updated = { ...specifications };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = value;
    onChange(updated);
  };

  const addCommonSpec = (spec: { key: string; placeholder: string }) => {
    if (!specifications[spec.key]) {
      onChange({ ...specifications, [spec.key]: "" });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Характеристики товара</CardTitle>
        <p className="text-sm text-muted-foreground">
          Добавьте характеристики для фильтрации в каталоге
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Specifications */}
        {specsList.length > 0 && (
          <div className="space-y-2">
            {specsList.map((spec, index) => (
              <div key={index} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <Input
                  value={spec.key}
                  onChange={(e) => updateSpecification(spec.key, e.target.value, spec.value)}
                  placeholder="Название"
                  className="flex-1"
                />
                <Input
                  value={spec.value}
                  onChange={(e) => updateSpecification(spec.key, spec.key, e.target.value)}
                  placeholder="Значение"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSpecification(spec.key)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Specification */}
        <div className="flex items-end gap-2 pt-2 border-t">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Название</Label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="например: Вес"
              onKeyDown={(e) => e.key === "Enter" && addSpecification()}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Значение</Label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="например: 1 кг"
              onKeyDown={(e) => e.key === "Enter" && addSpecification()}
            />
          </div>
          <Button onClick={addSpecification} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Add Common Specs */}
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground mb-2 block">Быстрое добавление:</Label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SPECS.filter(spec => !specifications[spec.key]).slice(0, 6).map((spec) => (
              <Button
                key={spec.key}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => addCommonSpec(spec)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {spec.key}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
