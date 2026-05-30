import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Cat,
  Plus,
  X,
  Pencil,
  Trash2,
  Weight,
  Calendar,
  Palette,
  Save,
} from "lucide-react";

const CAT_IMAGES = [
  "/images/cat-1.jpg",
  "/images/cat-2.jpg",
  "/images/cat-3.jpg",
  "/images/cat-4.jpg",
];

export default function Profiles() {
  const utils = trpc.useUtils();
  const { data: cats, isLoading } = trpc.cat.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    breed: "",
    age: "",
    weight: "",
    color: "",
    avatarUrl: "",
    personalityTags: "",
  });

  const createCat = trpc.cat.create.useMutation({
    onSuccess: () => {
      utils.cat.list.invalidate();
      resetForm();
      setShowForm(false);
    },
  });

  const updateCat = trpc.cat.update.useMutation({
    onSuccess: () => {
      utils.cat.list.invalidate();
      resetForm();
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteCat = trpc.cat.delete.useMutation({
    onSuccess: () => utils.cat.list.invalidate(),
  });

  const resetForm = () => {
    setForm({
      name: "",
      breed: "",
      age: "",
      weight: "",
      color: "",
      avatarUrl: "",
      personalityTags: "",
    });
  };

  const startEdit = (cat: NonNullable<typeof cats>[0]) => {
    setForm({
      name: cat.name,
      breed: cat.breed ?? "",
      age: cat.age ? String(cat.age) : "",
      weight: cat.weight ? String(cat.weight) : "",
      color: cat.color ?? "",
      avatarUrl: cat.avatarUrl ?? "",
      personalityTags: (cat.personalityTags as string[])?.join(", ") ?? "",
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = form.personalityTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const data = {
      name: form.name,
      breed: form.breed || undefined,
      age: form.age ? Number(form.age) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      color: form.color || undefined,
      avatarUrl: form.avatarUrl || undefined,
      personalityTags: tags.length > 0 ? tags : undefined,
    };
    if (editingId) {
      updateCat.mutate({ id: editingId, ...data });
    } else {
      createCat.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#080818] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-white/90"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Cat Profiles
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Manage your cats for personalized translation
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="glass-button px-4 py-2.5 flex items-center gap-2 text-xs font-medium"
          >
            {showForm ? (
              <>
                <X className="w-3.5 h-3.5" /> Cancel
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Add Cat
              </>
            )}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-panel p-6 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <h2 className="text-lg font-semibold text-white/90 mb-4">
              {editingId ? "Edit Cat Profile" : "New Cat Profile"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  placeholder="e.g., Whiskers"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">
                  Breed
                </label>
                <input
                  type="text"
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  placeholder="e.g., Maine Coon"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">
                  Age (years)
                </label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  min="0"
                  max="30"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  placeholder="e.g., 3"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  min="0"
                  max="50"
                  step="0.1"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  placeholder="e.g., 4.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">
                  Color
                </label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  placeholder="e.g., Orange tabby"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">
                  Personality Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.personalityTags}
                  onChange={(e) =>
                    setForm({ ...form, personalityTags: e.target.value })
                  }
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  placeholder="e.g., playful, vocal, shy"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/[0.12] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCat.isPending || updateCat.isPending}
                  className="glass-button px-6 py-2.5 flex items-center gap-2 text-xs font-medium disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-32 bg-white/5 rounded-xl mb-4" />
                <div className="h-5 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !cats || cats.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Cat className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm">No cat profiles yet</p>
            <p className="text-white/20 text-xs mt-1">
              Add your first cat to get personalized translations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cats.map((cat, index) => {
              const tags = (cat.personalityTags as string[]) ?? [];
              return (
                <div key={cat.id} className="glass-card overflow-hidden group">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={cat.avatarUrl || CAT_IMAGES[index % CAT_IMAGES.length]}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080818] via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/60 hover:text-[#33ff99] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this cat profile?")) {
                            deleteCat.mutate({ id: cat.id });
                          }
                        }}
                        className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white/90 mb-1">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-white/40 mb-3">
                      {cat.breed || "Unknown breed"}
                    </p>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {cat.age !== null && (
                        <div className="flex items-center gap-1 text-[11px] text-white/40">
                          <Calendar className="w-3 h-3" />
                          {cat.age} years
                        </div>
                      )}
                      {cat.weight !== null && (
                        <div className="flex items-center gap-1 text-[11px] text-white/40">
                          <Weight className="w-3 h-3" />
                          {cat.weight} kg
                        </div>
                      )}
                      {cat.color && (
                        <div className="flex items-center gap-1 text-[11px] text-white/40">
                          <Palette className="w-3 h-3" />
                          {cat.color}
                        </div>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-[#33ff99]/10 text-[#33ff99]/80 capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
