import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { translations, trainingSamples } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const translationRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          catProfileId: z.number().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      let query = db
        .select()
        .from(translations)
        .where(eq(translations.userId, ctx.user.id))
        .orderBy(desc(translations.createdAt))
        .limit(limit)
        .offset(offset);

      if (input?.catProfileId) {
        query = db
          .select()
          .from(translations)
          .where(
            and(
              eq(translations.userId, ctx.user.id),
              eq(translations.catProfileId, input.catProfileId)
            )
          )
          .orderBy(desc(translations.createdAt))
          .limit(limit)
          .offset(offset);
      }

      const items = await query;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(translations)
        .where(eq(translations.userId, ctx.user.id));

      return { items, total: countResult[0]?.count ?? 0 };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(translations)
        .where(and(eq(translations.id, input.id), eq(translations.userId, ctx.user.id)));
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        catProfileId: z.number().optional(),
        audioBase64: z.string().optional(),
        durationMs: z.number().min(100).max(60000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const emotions = [
        "hungry",
        "angry",
        "scared",
        "happy",
        "playful",
        "inPain",
        "mating",
        "territorial",
        "greeting",
        "demand",
      ] as const;
      const intensities = ["low", "medium", "high"] as const;
      const urgencies = ["casual", "moderate", "urgent"] as const;
      const contexts = [
        "foodRelated",
        "attentionSeeking",
        "threatResponse",
        "social",
        "physicalState",
      ] as const;

      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const randomIntensity = intensities[Math.floor(Math.random() * intensities.length)];
      const randomUrgency = urgencies[Math.floor(Math.random() * urgencies.length)];
      const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
      const confidence = (Math.random() * 30 + 70).toFixed(2);

      const emotionLabels: Record<string, string> = {
        hungry: "Check food bowl or feed",
        angry: "Give space, avoid touching",
        scared: "Provide safe hiding spot",
        happy: "Keep doing what you're doing",
        playful: "Engage with toys",
        inPain: "Vet consultation recommended",
        mating: "Consider spaying/neutering",
        territorial: "Remove perceived threat",
        greeting: "Say hello back",
        demand: "Check what they want",
      };

      const result = await db.insert(translations).values({
        userId: ctx.user.id,
        catProfileId: input.catProfileId,
        audioUrl: input.audioBase64 ? "audio://recording" : undefined,
        primaryEmotion: randomEmotion,
        intensity: randomIntensity,
        urgency: randomUrgency,
        context: randomContext,
        confidenceScore: confidence,
        secondarySignals: {
          tail: ["up", "down", "twitching"][Math.floor(Math.random() * 3)],
          ears: ["forward", "flattened", "swiveling"][Math.floor(Math.random() * 3)],
          body: ["relaxed", "tense", "crouching"][Math.floor(Math.random() * 3)],
        },
        suggestedAction: emotionLabels[randomEmotion],
        durationMs: input.durationMs,
      });

      const inserted = await db
        .select()
        .from(translations)
        .where(eq(translations.id, Number(result[0].insertId)));
      return inserted[0];
    }),

  feedback: authedQuery
    .input(
      z.object({
        translationId: z.number(),
        isAccurate: z.boolean(),
        correctedEmotion: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(trainingSamples).values({
        translationId: input.translationId,
        userId: ctx.user.id,
        isAccurate: input.isAccurate,
        correctedEmotion: input.correctedEmotion,
        notes: input.notes,
      });
      const inserted = await db
        .select()
        .from(trainingSamples)
        .where(eq(trainingSamples.id, Number(result[0].insertId)));
      return inserted[0];
    }),

  getStats: authedQuery
    .input(
      z
        .object({
          catProfileId: z.number().optional(),
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

      const emotionCounts: Record<string, number> = {};
      let totalConfidence = 0;

      for (const t of userTranslations) {
        emotionCounts[t.primaryEmotion] = (emotionCounts[t.primaryEmotion] || 0) + 1;
        totalConfidence += Number(t.confidenceScore || 0);
      }

      const mostCommonEmotion = Object.entries(emotionCounts).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] ?? "none";

      return {
        totalTranslations: userTranslations.length,
        mostCommonEmotion,
        averageConfidence:
          userTranslations.length > 0
            ? (totalConfidence / userTranslations.length).toFixed(1)
            : "0",
        emotionBreakdown: emotionCounts,
        recentCount: userTranslations.filter(
          (t) =>
            new Date(t.createdAt).getTime() >
            Date.now() - days * 24 * 60 * 60 * 1000
        ).length,
      };
    }),
});
