import { trpc } from "@/providers/trpc";
import {
  Activity,
  TrendingUp,
  Cat,
  Flame,
  BarChart3,
  PieChart,
  Lightbulb,
} from "lucide-react";

const emotionColors: Record<string, string> = {
  hungry: "#f59e0b",
  angry: "#ef4444",
  scared: "#8b5cf6",
  happy: "#33ff99",
  playful: "#33ccdd",
  inPain: "#f43f5e",
  mating: "#ec4899",
  territorial: "#f97316",
  greeting: "#22d3ee",
  demand: "#a78bfa",
};

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } =
    trpc.dashboard.summary.useQuery();
  trpc.dashboard.emotionTrend.useQuery();
  const { data: weekly } = trpc.dashboard.weeklyReport.useQuery();

  const isLoading = summaryLoading;

  return (
    <div className="min-h-screen bg-[#080818] pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-white/90"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Overview of your cat communication analytics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Translations",
              value: summary?.totalTranslations ?? 0,
              icon: Activity,
              color: "#33ff99",
            },
            {
              label: "Most Common",
              value: summary?.mostCommonEmotion
                ? summary.mostCommonEmotion.charAt(0).toUpperCase() +
                  summary.mostCommonEmotion.slice(1)
                : "N/A",
              icon: TrendingUp,
              color: "#33ccdd",
            },
            {
              label: "Active Cats",
              value: summary?.activeCats ?? 0,
              icon: Cat,
              color: "#a78bfa",
            },
            {
              label: "Active Days",
              value: summary?.streakDays ?? 0,
              icon: Flame,
              color: "#f97316",
            },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              {isLoading ? (
                <div className="h-8 bg-white/5 rounded animate-pulse" />
              ) : (
                <>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-white/30 mt-1">{stat.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Emotion Breakdown */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-4 h-4 text-[#33ff99]" />
              <h2 className="text-sm font-semibold text-white/90">
                Emotion Distribution
              </h2>
            </div>
            {weekly?.emotionBreakdown &&
            Object.keys(weekly.emotionBreakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(weekly.emotionBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, count]) => {
                    const total = Object.values(weekly.emotionBreakdown).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const pct = ((count / total) * 100).toFixed(0);
                    const color = emotionColors[emotion] ?? "#33ff99";
                    return (
                      <div key={emotion}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/60 capitalize">
                            {emotion}
                          </span>
                          <span className="text-xs text-white/40">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">No data yet</p>
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-4 h-4 text-[#33ccdd]" />
              <h2 className="text-sm font-semibold text-white/90">
                Weekly Insights
              </h2>
            </div>
            {weekly?.insights && weekly.insights.length > 0 ? (
              <div className="space-y-3">
                {weekly.insights.map((insight, i) => (
                  <div
                    key={i}
                    className="glass-card p-4 border-l-2 border-l-[#33ccdd]/40"
                  >
                    <p className="text-xs text-white/60 leading-relaxed">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">
                  Start translating to get insights
                </p>
              </div>
            )}

            {weekly?.topCat && (
              <div className="mt-4 glass-card p-4">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                  Most Vocal Cat
                </p>
                <div className="flex items-center gap-3">
                  <Cat className="w-5 h-5 text-[#33ff99]" />
                  <span className="text-sm font-medium text-white/80">
                    {weekly.topCat.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-sm font-semibold text-white/90">
              Recent Activity
            </h2>
          </div>
          {summary?.recentActivity && summary.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {summary.recentActivity.map((activity) => {
                const color = emotionColors[activity.emotion] ?? "#33ff99";
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-xs text-white/60 capitalize flex-1">
                      {activity.emotion}
                    </span>
                    <span className="text-xs text-white/30">
                      {activity.confidence ?? "0"}%
                    </span>
                    <span className="text-[10px] text-white/20">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/30">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
