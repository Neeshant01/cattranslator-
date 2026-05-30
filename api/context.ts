import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { users } from "@db/schema";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const db = getDb();
    let userRow = await db.select().from(users).where(eq(users.id, 1)).limit(1);
    if (!userRow[0]) {
      await db.insert(users).values({
        id: 1,
        unionId: "mock-user-id",
        name: "Cat Lover",
        role: "admin",
      });
      userRow = await db.select().from(users).where(eq(users.id, 1)).limit(1);
    }
    ctx.user = userRow[0];
  } catch (err) {
    console.error("Failed to authenticate request with mock user:", err);
  }
  return ctx;
}
