import { createApp } from "./app";
import type { AppEnv } from "./env";
import { expireOrders } from "./services/orders";

const app = createApp();

export default {
  fetch(request: Request, env: AppEnv, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  async scheduled(_controller: ScheduledController, env: AppEnv, ctx: ExecutionContext) {
    ctx.waitUntil(expireOrders(env.DB));
  },
};
