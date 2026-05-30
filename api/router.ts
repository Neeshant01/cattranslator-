import { authRouter } from "./auth-router";
import { catRouter } from "./cat-router";
import { translationRouter } from "./translation-router";
import { humanToCatRouter } from "./human-to-cat-router";
import { settingsRouter } from "./settings-router";
import { dashboardRouter } from "./dashboard-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  cat: catRouter,
  translation: translationRouter,
  humanToCat: humanToCatRouter,
  settings: settingsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
