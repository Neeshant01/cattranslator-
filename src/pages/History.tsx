import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Clock,
  Filter,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cat,
} from "lucide-react";

const emotionConfig: Record<string, { color: string; bg: string }> = {
  hungry: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  angry: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  scared: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  happy: { color: "#33ff99", bg: "rgba(51,255,153,0.1)" },
  playful: { color: "#33ccdd", bg: "rgba(51,204,221,0.1)" },
  inPain: { color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
  mating: { color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  territorial: { color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  greeting: { color: "#22d3ee", bg: "rgba(34,211,238,0.1)" },
  demand: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
};

export default function History() {
  const [page, setPage] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>();
  const limit = 12;

  const { data, isLoading } = trpc.translation.list.useQuery({
    limit,
    offset: page * limit,
  });

  const { data: stats } = trpc.translation.getStats.useQuery();

  const translations = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const filtered = selectedFilter
    ? translations.filter((t) => t.primaryEmotion === selectedFilter)
    : translations;

  return (
    <div className="min-h-screen bg-[#080818] pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-white/90"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Translation History
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {total} translations recorded
            </p>
          </div>

          {stats && (
            <div className="flex items-center gap-4">
              <div className="glass-card px-4 py-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#33ff99]" />
                <span className="text-xs text-white/60">
                  Avg Confidence: {stats.averageConfidence}%
                </span>
              </div>
              <div className="glass-card px-4 py-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#33ccdd]" />
                <span className="text-xs text-white/60 capitalize">
                  Top: {stats.mostCommonEmotion}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-white/30 flex-shrink-0" />
          <button
            onClick={() => setSelectedFilter(undefined)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              !selectedFilter
                ? "bg-[#33ff99]/15 text-[#33ff99] border border-[#33ff99]/25"
                : "text-white/40 hover:text-white/60 bg-white/[0.03] border border-white/[0.06]"
            }`}
          >
            All
          </button>
          {Object.keys(emotionConfig).map((emotion) => (
            <button
              key={emotion}
              onClick={() => setSelectedFilter(emotion)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap capitalize ${
                selectedFilter === emotion
                  ? "border"
                  : "text-white/40 hover:text-white/60 bg-white/[0.03] border border-white/[0.06]"
              }`}
              style={
                selectedFilter === emotion
                  ? {
                      background: emotionConfig[emotion].bg,
                      color: emotionConfig[emotion].color,
                      borderColor: `${emotionConfig[emotion].color}40`,
                    }
                  : {}
              }
            >
              {emotion}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
                <div className="h-6 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Cat className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm">No translations found</p>
            <p className="text-white/20 text-xs mt-1">
              Start recording to see your cat's translations here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((translation) => {
              const config = emotionConfig[translation.primaryEmotion] ?? {
                color: "#33ff99",
                bg: "rgba(51,255,153,0.1)",
              };
              return (
                <div
                  key={translation.id}
                  className="glass-card p-5 group hover:border-opacity-30 transition-all duration-300"
                  style={{
                    borderColor: `${config.color}15`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-white/20" />
                      <span className="text-[11px] text-white/30">
                        {new Date(translation.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium capitalize"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {translation.primaryEmotion}
                    </span>
                  </div>

                  <h3
                    className="text-lg font-semibold mb-1 capitalize"
                    style={{ color: config.color }}
                  >
                    {translation.primaryEmotion}
                  </h3>

                  <p className="text-xs text-white/40 mb-3 line-clamp-2">
                    {translation.suggestedAction}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/30 capitalize">
                        {translation.intensity}
                      </span>
                      <span className="text-[10px] text-white/20">|</span>
                      <span className="text-[10px] text-white/30 capitalize">
                        {translation.urgency}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: config.color }}
                    >
                      {translation.confidenceScore}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.03] disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-white/40 px-3">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.03] disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
