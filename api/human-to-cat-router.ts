import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { humanToCatTranslations } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const humanToCatRouter = createRouter({
  translate: authedQuery
    .input(
      z.object({
        text: z.string().min(1).max(500),
        targetCatProfileId: z.number().optional(),
        emotion: z.string().optional(),
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

      const intentMap: Record<string, string> = {
        hungry: "Come eat",
        angry: "Stop that",
        scared: "It's okay",
        happy: "I love you",
        playful: "Let's play",
        inPain: "Help me",
        mating: "I'm here",
        territorial: "Go away",
        greeting: "Hello",
        demand: "Now",
      };

      const detectedEmotion =
        input.emotion ?? emotions[Math.floor(Math.random() * emotions.length)];
      const mappedIntent = intentMap[detectedEmotion] ?? "Meow";

      const result = await db.insert(humanToCatTranslations).values({
        userId: ctx.user.id,
        inputText: input.text,
        detectedLanguage: "en",
        mappedIntent,
        outputEmotion: detectedEmotion as (typeof emotions)[number],
      });

      const inserted = await db
        .select()
        .from(humanToCatTranslations)
        .where(eq(humanToCatTranslations.id, Number(result[0].insertId)));

      return {
        intent: mappedIntent,
        emotion: detectedEmotion,
        audioUrl: "synth://meow",
        record: inserted[0],
      };
    }),

  list: authedQuery
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const limit = input?.limit ?? 20;
      return db
        .select()
        .from(humanToCatTranslations)
        .where(eq(humanToCatTranslations.userId, ctx.user.id))
        .orderBy(desc(humanToCatTranslations.createdAt))
        .limit(limit);
    }),
});
