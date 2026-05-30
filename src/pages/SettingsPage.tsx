import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import {
  Volume2,
  Globe,
  Shield,
  Bell,
  Save,
  Check,
  Cat,
} from "lucide-react";

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const { data: cats } = trpc.cat.list.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    audioSensitivity: 50,
    languagePreference: "en",
    privacyMode: true,
    notificationsEnabled: true,
    defaultCatProfileId: undefined as number | undefined,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        audioSensitivity: settings.audioSensitivity,
        languagePreference: settings.languagePreference ?? "en",
        privacyMode: settings.privacyMode,
        notificationsEnabled: settings.notificationsEnabled,
        defaultCatProfileId: settings.defaultCatProfileId ?? undefined,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      audioSensitivity: form.audioSensitivity,
      languagePreference: form.languagePreference,
      privacyMode: form.privacyMode,
      notificationsEnabled: form.notificationsEnabled,
      defaultCatProfileId: form.defaultCatProfileId,
    });
  };

  return (
    <div className="min-h-screen bg-[#080818] pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-white/90"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Settings
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Customize your Purrception experience
          </p>
        </div>

        {isLoading ? (
          <div className="glass-panel p-8 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-1/3 mb-4" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Audio Sensitivity */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#33ff99]/10 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-[#33ff99]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white/90">
                    Audio Sensitivity
                  </h2>
                  <p className="text-[11px] text-white/30">
                    Adjust microphone sensitivity for better detection
                  </p>
                </div>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={form.audioSensitivity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      audioSensitivity: Number(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-[#33ff99]"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-white/20">Low</span>
                  <span className="text-xs text-[#33ff99] font-medium">
                    {form.audioSensitivity}%
                  </span>
                  <span className="text-[10px] text-white/20">High</span>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#33ccdd]/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#33ccdd]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white/90">
                    Language
                  </h2>
                  <p className="text-[11px] text-white/30">
                    Interface language preference
                  </p>
                </div>
              </div>
              <select
                value={form.languagePreference}
                onChange={(e) =>
                  setForm({ ...form, languagePreference: e.target.value })
                }
                className="glass-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer"
              >
                <option value="en" className="bg-[#080818]">
                  English
                </option>
                <option value="hi" className="bg-[#080818]">
                  Hindi
                </option>
                <option value="es" className="bg-[#080818]">
                  Spanish
                </option>
                <option value="fr" className="bg-[#080818]">
                  French
                </option>
                <option value="de" className="bg-[#080818]">
                  German
                </option>
                <option value="ja" className="bg-[#080818]">
                  Japanese
                </option>
              </select>
            </div>

            {/* Default Cat */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center">
                  <Cat className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white/90">
                    Default Cat Profile
                  </h2>
                  <p className="text-[11px] text-white/30">
                    Select your primary cat for translations
                  </p>
                </div>
              </div>
              <select
                value={form.defaultCatProfileId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultCatProfileId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="glass-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#080818]">
                  None (all cats)
                </option>
                {cats?.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#080818]">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Privacy */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f97316]/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#f97316]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white/90">
                      Privacy Mode
                    </h2>
                    <p className="text-[11px] text-white/30">
                      On-device processing only
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setForm({ ...form, privacyMode: !form.privacyMode })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    form.privacyMode ? "bg-[#33ff99]/30" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
                      form.privacyMode
                        ? "left-6 bg-[#33ff99]"
                        : "left-0.5 bg-white/40"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ec4899]/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#ec4899]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white/90">
                      Notifications
                    </h2>
                    <p className="text-[11px] text-white/30">
                      Weekly insights and updates
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      notificationsEnabled: !form.notificationsEnabled,
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    form.notificationsEnabled ? "bg-[#33ff99]/30" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
                      form.notificationsEnabled
                        ? "left-6 bg-[#33ff99]"
                        : "left-0.5 bg-white/40"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className={`glass-button px-6 py-3 flex items-center gap-2 text-sm font-medium disabled:opacity-50 ${
                  saved ? "bg-[#33ff99]/20" : ""
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
