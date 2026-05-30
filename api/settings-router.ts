import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { userSettings } from "@db/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id));

    if (result.length === 0) {
      const insertResult = await db.insert(userSettings).values({
        userId: ctx.user.id,
        audioSensitivity: 50,
        languagePreference: "en",
        privacyMode: true,
        notificationsEnabled: true,
      });
      const inserted = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.id, Number(insertResult[0].insertId)));
      return inserted[0];
    }

    return result[0];
  }),

  update: authedQuery
    .input(
      z.object({
        audioSensitivity: z.number().min(1).max(100).optional(),
        languagePreference: z.string().max(10).optional(),
        privacyMode: z.boolean().optional(),
        notificationsEnabled: z.boolean().optional(),
        defaultCatProfileId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id));

      if (existing.length === 0) {
        const insertResult = await db.insert(userSettings).values({
          userId: ctx.user.id,
          ...input,
        });
        const inserted = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.id, Number(insertResult[0].insertId)));
        return inserted[0];
      }

      await db
        .update(userSettings)
        .set(input)
        .where(eq(userSettings.userId, ctx.user.id));

      const updated = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id));
      return updated[0];
    }),
});
