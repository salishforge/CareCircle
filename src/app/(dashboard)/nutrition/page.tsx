"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Salad, X, Plus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface NutritionProfile {
  allergies: string[];
  intolerances: string[];
  dietaryRestrictions: string[];
  treatmentType: string | null;
  currentSymptoms: string[];
  calorieTarget: number;
  proteinTarget: number;
  hydrationTarget: number;
  preferredFoods: string[];
  dislikedFoods: string[];
  texturePreference: string;
  oncologistNotes: string | null;
}

const DEFAULT_PROFILE: NutritionProfile = {
  allergies: [],
  intolerances: [],
  dietaryRestrictions: [],
  treatmentType: null,
  currentSymptoms: [],
  calorieTarget: 2000,
  proteinTarget: 75,
  hydrationTarget: 8,
  preferredFoods: [],
  dislikedFoods: [],
  texturePreference: "NORMAL",
  oncologistNotes: null,
};

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  }

  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="h-9 text-sm"
        />
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={add}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1">
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NutritionPage() {
  const [profile, setProfile] = useState<NutritionProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/nutrition")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && data.calorieTarget) {
          setProfile({ ...DEFAULT_PROFILE, ...data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) toast.success("Nutrition profile saved");
      else toast.error("Failed to save");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold">Nutrition Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Dietary needs, allergies, and nutrition targets
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Allergies & Intolerances */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Salad className="h-4 w-4" />
              Allergies & Diet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TagInput
              label="Allergies"
              tags={profile.allergies}
              onChange={(v) => setProfile({ ...profile, allergies: v })}
              placeholder="e.g., Peanuts"
            />
            <TagInput
              label="Intolerances"
              tags={profile.intolerances}
              onChange={(v) => setProfile({ ...profile, intolerances: v })}
              placeholder="e.g., Lactose"
            />
            <TagInput
              label="Dietary Restrictions"
              tags={profile.dietaryRestrictions}
              onChange={(v) => setProfile({ ...profile, dietaryRestrictions: v })}
              placeholder="e.g., Low sodium"
            />
          </CardContent>
        </Card>

        {/* Food Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TagInput
              label="Preferred Foods"
              tags={profile.preferredFoods}
              onChange={(v) => setProfile({ ...profile, preferredFoods: v })}
              placeholder="e.g., Chicken soup"
            />
            <TagInput
              label="Disliked Foods"
              tags={profile.dislikedFoods}
              onChange={(v) => setProfile({ ...profile, dislikedFoods: v })}
              placeholder="e.g., Broccoli"
            />
            <div>
              <Label className="text-sm">Texture Preference</Label>
              <Select
                value={profile.texturePreference}
                onValueChange={(v) => v && setProfile({ ...profile, texturePreference: v })}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="SOFT">Soft</SelectItem>
                  <SelectItem value="PUREED">Pureed</SelectItem>
                  <SelectItem value="LIQUID">Liquid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Targets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daily Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Calories</Label>
                <Input
                  type="number"
                  value={profile.calorieTarget}
                  onChange={(e) =>
                    setProfile({ ...profile, calorieTarget: parseInt(e.target.value) || 2000 })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                <Input
                  type="number"
                  value={profile.proteinTarget}
                  onChange={(e) =>
                    setProfile({ ...profile, proteinTarget: parseInt(e.target.value) || 75 })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Water (cups)</Label>
                <Input
                  type="number"
                  value={profile.hydrationTarget}
                  onChange={(e) =>
                    setProfile({ ...profile, hydrationTarget: parseInt(e.target.value) || 8 })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Treatment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Treatment Type</Label>
              <Select
                value={profile.treatmentType ?? "none"}
                onValueChange={(v) =>
                  setProfile({ ...profile, treatmentType: v === "none" ? null : v })
                }
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="CHEMO">Chemotherapy</SelectItem>
                  <SelectItem value="RADIATION">Radiation</SelectItem>
                  <SelectItem value="IMMUNOTHERAPY">Immunotherapy</SelectItem>
                  <SelectItem value="SURGERY">Surgery</SelectItem>
                  <SelectItem value="COMBINATION">Combination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TagInput
              label="Current Symptoms"
              tags={profile.currentSymptoms}
              onChange={(v) => setProfile({ ...profile, currentSymptoms: v })}
              placeholder="e.g., Nausea"
            />
            <div>
              <Label className="text-sm">Oncologist Notes</Label>
              <Textarea
                value={profile.oncologistNotes ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, oncologistNotes: e.target.value || null })
                }
                placeholder="Any notes from the care team..."
                rows={3}
                className="mt-1 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Profile
        </Button>
      </form>
    </div>
  );
}
