import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { catProfiles } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const catRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(catProfiles).where(eq(catProfiles.userId, ctx.user.id));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(catProfiles)
        .where(and(eq(catProfiles.id, input.id), eq(catProfiles.userId, ctx.user.id)));
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        breed: z.string().max(100).optional(),
        age: z.number().min(0).max(30).optional(),
        weight: z.number().min(0).max(50).optional(),
        color: z.string().max(50).optional(),
        avatarUrl: z.string().max(500).optional(),
        personalityTags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(catProfiles).values({
        userId: ctx.user.id,
        name: input.name,
        breed: input.breed,
        age: input.age,
        weight: input.weight ? String(input.weight) : undefined,
        color: input.color,
        avatarUrl: input.avatarUrl,
        personalityTags: input.personalityTags,
      });
      const inserted = await db
        .select()
        .from(catProfiles)
        .where(eq(catProfiles.id, Number(result[0].insertId)));
      return inserted[0];
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        breed: z.string().max(100).optional(),
        age: z.number().min(0).max(30).optional(),
        weight: z.number().min(0).max(50).optional(),
        color: z.string().max(50).optional(),
        avatarUrl: z.string().max(500).optional(),
        personalityTags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(catProfiles)
        .set({
          ...data,
          weight: data.weight ? String(data.weight) : undefined,
        })
        .where(and(eq(catProfiles.id, id), eq(catProfiles.userId, ctx.user.id)));
      const result = await db
        .select()
        .from(catProfiles)
        .where(eq(catProfiles.id, id));
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(catProfiles)
        .where(and(eq(catProfiles.id, input.id), eq(catProfiles.userId, ctx.user.id)));
      return { success: true };
    }),
});
