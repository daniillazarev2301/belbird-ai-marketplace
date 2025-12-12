import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  PawPrint,
  Calendar,
  Scale,
  Heart,
  AlertTriangle,
  Camera,
  Sparkles,
} from "lucide-react";

interface Pet {
  id: string;
  name: string;
  type: "cat" | "dog" | "bird" | "small";
  breed: string;
  age: number;
  weight: number;
  gender: "male" | "female";
  photo?: string;
  allergies?: string[];
  specialNeeds?: string;
  lastVetVisit?: string;
}

const pets: Pet[] = [
  {
    id: "1",
    name: "Мурка",
    type: "cat",
    breed: "Британская короткошёрстная",
    age: 3,
    weight: 4.5,
    gender: "female",
    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop",
    allergies: ["Курица", "Пшеница"],
    specialNeeds: "Склонность к ожирению, диетическое питание",
    lastVetVisit: "15.11.2024",
  },
  {
    id: "2",
    name: "Рекс",
    type: "dog",
    breed: "Лабрадор-ретривер",
    age: 5,
    weight: 32,
    gender: "male",
    photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
    allergies: [],
    specialNeeds: "Артрит, нужны добавки для суставов",
    lastVetVisit: "01.12.2024",
  },
];

const typeLabels: Record<string, string> = {
  cat: "Кошка",
  dog: "Собака",
  bird: "Птица",
  small: "Грызун",
};

const genderLabels: Record<string, string> = {
  male: "Мальчик",
  female: "Девочка",
};

const AccountPets = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  return (
    <>
      <Helmet>
        <title>Мои питомцы — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold">Мои питомцы</h1>
              <p className="text-muted-foreground">
                Добавьте питомцев для персональных рекомендаций
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить питомца
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавить питомца</DialogTitle>
                </DialogHeader>
                <PetForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* AI Recommendation Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">AI-рекомендации</h3>
                <p className="text-sm text-muted-foreground">
                  На основе профилей ваших питомцев мы подберём идеальные товары
                </p>
              </div>
              <Button variant="outline" size="sm">
                Смотреть подборку
              </Button>
            </CardContent>
          </Card>

          {/* Pets Grid */}
          {pets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">У вас пока нет питомцев</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Добавьте питомца, чтобы получать персональные рекомендации
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Добавить питомца
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pets.map((pet) => (
                <Card key={pet.id}>
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={pet.photo} />
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                            <PawPrint className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <button className="absolute bottom-0 right-0 p-1 rounded-full bg-muted border border-border hover:bg-accent transition-colors">
                          <Camera className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{pet.name}</h3>
                          <Badge variant="outline">{typeLabels[pet.type]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pet.breed}</p>
                        <p className="text-sm text-muted-foreground">{genderLabels[pet.gender]}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPet(pet)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{pet.age}</p>
                        <p className="text-xs text-muted-foreground">лет</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <Scale className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{pet.weight}</p>
                        <p className="text-xs text-muted-foreground">кг</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{pet.lastVetVisit ? "✓" : "—"}</p>
                        <p className="text-xs text-muted-foreground">ветеринар</p>
                      </div>
                    </div>

                    {/* Allergies */}
                    {pet.allergies && pet.allergies.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium flex items-center gap-1 mb-2">
                          <AlertTriangle className="h-4 w-4 text-secondary" />
                          Аллергии
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pet.allergies.map((allergy) => (
                            <Badge key={allergy} variant="secondary" className="text-xs">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Needs */}
                    {pet.specialNeeds && (
                      <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                        <p className="text-sm font-medium mb-1">Особые потребности</p>
                        <p className="text-sm text-muted-foreground">{pet.specialNeeds}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Sparkles className="h-4 w-4" />
                        Товары для {pet.name}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingPet} onOpenChange={() => setEditingPet(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать {editingPet?.name}</DialogTitle>
            </DialogHeader>
            {editingPet && <PetForm pet={editingPet} onClose={() => setEditingPet(null)} />}
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
};

interface PetFormProps {
  pet?: Pet;
  onClose: () => void;
}

const PetForm = ({ pet, onClose }: PetFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={pet?.photo} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <PawPrint className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground">
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Кличка</Label>
          <Input defaultValue={pet?.name} placeholder="Барсик" />
        </div>
        <div className="space-y-2">
          <Label>Тип</Label>
          <Select defaultValue={pet?.type || "cat"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cat">Кошка</SelectItem>
              <SelectItem value="dog">Собака</SelectItem>
              <SelectItem value="bird">Птица</SelectItem>
              <SelectItem value="small">Грызун</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Порода</Label>
          <Input defaultValue={pet?.breed} placeholder="Британская короткошёрстная" />
        </div>
        <div className="space-y-2">
          <Label>Возраст (лет)</Label>
          <Input type="number" defaultValue={pet?.age} placeholder="3" />
        </div>
        <div className="space-y-2">
          <Label>Вес (кг)</Label>
          <Input type="number" step="0.1" defaultValue={pet?.weight} placeholder="4.5" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Пол</Label>
          <Select defaultValue={pet?.gender || "male"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Мальчик</SelectItem>
              <SelectItem value="female">Девочка</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Аллергии (через запятую)</Label>
          <Input defaultValue={pet?.allergies?.join(", ")} placeholder="Курица, пшеница" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Особые потребности</Label>
          <Textarea
            defaultValue={pet?.specialNeeds}
            placeholder="Опишите особенности здоровья или диеты..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Отмена
        </Button>
        <Button className="flex-1" onClick={onClose}>
          {pet ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </div>
  );
};

export default AccountPets;
