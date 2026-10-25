export interface AppEnv {
  DB: D1Database;
  IMAGES: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  SHOP_NAME: string;
  SESSION_TTL_HOURS: string;
  ORDER_HOLD_MINUTES: string;
  MAX_UPLOAD_BYTES: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

export type AppContext = {
  Bindings: AppEnv;
  Variables: {
    adminEmail: string;
    requestId: string;
  };
};
