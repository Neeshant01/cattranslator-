import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { translations, catProfiles } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const dashboardRouter = createRouter({
  summary: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const userTranslations = await db
      .select()
      .from(translations)
      .where(eq(translations.userId, ctx.user.id))
      .orderBy(desc(translations.createdAt));

    const cats = await db
      .select()
      .from(catProfiles)
      .where(eq(catProfiles.userId, ctx.user.id));

    const emotionCounts: Record<string, number> = {};
    for (const t of userTranslations) {
      emotionCounts[t.primaryEmotion] = (emotionCounts[t.primaryEmotion] || 0) + 1;
    }

    const mostCommonEmotion = Object.entries(emotionCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] ?? "none";

    const uniqueDates = new Set(
      userTranslations.map((t) => new Date(t.createdAt).toDateString())
    );

    const recentActivity = userTranslations.slice(0, 5).map((t) => ({
      id: t.id,
      emotion: t.primaryEmotion,
      confidence: t.confidenceScore,
      timestamp: t.createdAt,
    }));

    return {
      totalTranslations: userTranslations.length,
      mostCommonEmotion,
      activeCats: cats.length,
      streakDays: uniqueDates.size,
      recentActivity,
    };
  }),

  emotionTrend: authedQuery
    .input(
      z
        .object({
          days: z.number().min(1).max(365).default(7),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const days = input?.days ?? 7;

      const userTranslations = await db
        .select()
        .from(translations)
        .where(eq(translations.userId, ctx.user.id))
        .orderBy(desc(translations.createdAt));

      const trend: Record<string, Record<string, number>> = {};

      for (const t of userTranslations) {
        const date = new Date(t.createdAt).toISOString().split("T")[0];
        if (new Date(t.createdAt).getTime() > Date.now() - days * 24 * 60 * 60 * 1000) {
          if (!trend[date]) trend[date] = {};
          trend[date][t.primaryEmotion] = (trend[date][t.primaryEmotion] || 0) + 1;
        }
      }

      return Object.entries(trend).map(([date, emotions]) => ({
        date,
        ...emotions,
      }));
    }),

  weeklyReport: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const userTranslations = await db
      .select()
      .from(translations)
      .where(eq(translations.userId, ctx.user.id))
      .orderBy(desc(translations.createdAt));

    const weeklyTranslations = userTranslations.filter(
      (t) => new Date(t.createdAt) >= weekStart
    );

    const emotionBreakdown: Record<string, number> = {};
    const catCounts: Record<string, number> = {};

    for (const t of weeklyTranslations) {
      emotionBreakdown[t.primaryEmotion] = (emotionBreakdown[t.primaryEmotion] || 0) + 1;
      if (t.catProfileId) {
        catCounts[t.catProfileId] = (catCounts[t.catProfileId] || 0) + 1;
      }
    }

    const topCatId = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    let topCat = null;

    if (topCatId) {
      const cats = await db
        .select()
        .from(catProfiles)
        .where(eq(catProfiles.id, Number(topCatId)));
      topCat = cats[0] ?? null;
    }

    const insights = [];
    if (emotionBreakdown["hungry"] && emotionBreakdown["hungry"] > 3) {
      insights.push("Your cat seems hungry frequently. Consider adjusting feeding schedule.");
    }
    if (emotionBreakdown["playful"] && emotionBreakdown["playful"] > 3) {
      insights.push("High playfulness detected! Your cat needs more enrichment activities.");
    }
    if (emotionBreakdown["angry"] && emotionBreakdown["angry"] > 2) {
      insights.push("Multiple anger signals detected. Check for environmental stressors.");
    }
    if (Object.keys(emotionBreakdown).length === 0) {
      insights.push("No translations recorded this week. Start analyzing your cat's sounds!");
    }

    return {
      weekStart: weekStart.toISOString().split("T")[0],
      translationCount: weeklyTranslations.length,
      emotionBreakdown,
      topCat,
      insights,
    };
  }),
});
