import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type PetProfile = Tables<"pet_profiles">;

const typeLabels: Record<string, string> = {
  cat: "Кошка",
  dog: "Собака",
  bird: "Птица",
  parrot: "Попугай",
  small: "Грызун",
  hamster: "Хомяк",
  rabbit: "Кролик",
  fish: "Рыбка",
  chicken: "Курица",
  chick: "Цыплёнок",
  duck: "Утка",
  goose: "Гусь",
  turkey: "Индейка",
  other_farm: "Другое (сельхоз)",
  other: "Другое",
};

const AccountPets = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast.error("Ошибка загрузки профилей питомцев");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    try {
      const { error } = await supabase
        .from('pet_profiles')
        .delete()
        .eq('id', petId);

      if (error) throw error;
      setPets(prev => prev.filter(p => p.id !== petId));
      toast.success("Питомец удалён");
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error("Ошибка при удалении");
    }
  };

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
                <PetForm 
                  onClose={() => setIsAddDialogOpen(false)} 
                  onSuccess={() => {
                    setIsAddDialogOpen(false);
                    fetchPets();
                  }}
                />
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pets.length === 0 ? (
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
                          <Badge variant="outline">{typeLabels[pet.species] || pet.species}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pet.breed || "Порода не указана"}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPet(pet)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeletePet(pet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{pet.age_years || "—"}</p>
                        <p className="text-xs text-muted-foreground">лет</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <Scale className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{pet.weight_kg || "—"}</p>
                        <p className="text-xs text-muted-foreground">кг</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">✓</p>
                        <p className="text-xs text-muted-foreground">профиль</p>
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
                    {pet.special_needs && (
                      <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                        <p className="text-sm font-medium mb-1">Особые потребности</p>
                        <p className="text-sm text-muted-foreground">{pet.special_needs}</p>
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
            {editingPet && (
              <PetForm 
                pet={editingPet} 
                onClose={() => setEditingPet(null)}
                onSuccess={() => {
                  setEditingPet(null);
                  fetchPets();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
};

interface PetFormProps {
  pet?: PetProfile;
  onClose: () => void;
  onSuccess: () => void;
}

const PetForm = ({ pet, onClose, onSuccess }: PetFormProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: pet?.name || "",
    species: pet?.species || "cat",
    breed: pet?.breed || "",
    age_years: pet?.age_years?.toString() || "",
    weight_kg: pet?.weight_kg?.toString() || "",
    allergies: pet?.allergies?.join(", ") || "",
    special_needs: pet?.special_needs || "",
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.species) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Необходимо авторизоваться");
        return;
      }

      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        age_years: formData.age_years ? parseInt(formData.age_years) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()).filter(Boolean) : null,
        special_needs: formData.special_needs || null,
        user_id: user.id,
      };

      if (pet) {
        const { error } = await supabase
          .from('pet_profiles')
          .update(petData)
          .eq('id', pet.id);
        if (error) throw error;
        toast.success("Профиль питомца обновлён");
      } else {
        const { error } = await supabase
          .from('pet_profiles')
          .insert(petData);
        if (error) throw error;
        toast.success("Питомец добавлен");
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving pet:', error);
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="h-24 w-24">
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
          <Label>Кличка *</Label>
          <Input 
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Барсик" 
          />
        </div>
        <div className="space-y-2">
          <Label>Тип *</Label>
          <Select 
            value={formData.species}
            onValueChange={(value) => setFormData(prev => ({ ...prev, species: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">🐕 Собака</SelectItem>
              <SelectItem value="cat">🐱 Кошка</SelectItem>
              <SelectItem value="parrot">🦜 Попугай</SelectItem>
              <SelectItem value="bird">🐦 Другая птица</SelectItem>
              <SelectItem value="hamster">🐹 Хомяк</SelectItem>
              <SelectItem value="rabbit">🐰 Кролик</SelectItem>
              <SelectItem value="small">🐁 Другой грызун</SelectItem>
              <SelectItem value="fish">🐟 Рыбка</SelectItem>
              <SelectItem value="chicken">🐔 Курица</SelectItem>
              <SelectItem value="chick">🐤 Цыплёнок</SelectItem>
              <SelectItem value="duck">🦆 Утка</SelectItem>
              <SelectItem value="goose">🪿 Гусь</SelectItem>
              <SelectItem value="turkey">🦃 Индейка</SelectItem>
              <SelectItem value="other_farm">🐄 Другое (сельхоз)</SelectItem>
              <SelectItem value="other">❓ Другое</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Порода</Label>
          <Input 
            value={formData.breed}
            onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
            placeholder="Британская короткошёрстная" 
          />
        </div>
        <div className="space-y-2">
          <Label>Возраст (лет)</Label>
          <Input 
            type="number" 
            value={formData.age_years}
            onChange={(e) => setFormData(prev => ({ ...prev, age_years: e.target.value }))}
            placeholder="3" 
          />
        </div>
        <div className="space-y-2">
          <Label>Вес (кг)</Label>
          <Input 
            type="number" 
            step="0.1" 
            value={formData.weight_kg}
            onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
            placeholder="4.5" 
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Аллергии (через запятую)</Label>
          <Input 
            value={formData.allergies}
            onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
            placeholder="Курица, пшеница" 
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Особые потребности</Label>
          <Textarea
            value={formData.special_needs}
            onChange={(e) => setFormData(prev => ({ ...prev, special_needs: e.target.value }))}
            placeholder="Опишите особенности здоровья или диеты..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
          Отмена
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {pet ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </div>
  );
};

export default AccountPets;
