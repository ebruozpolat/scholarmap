import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

// Lazy getters so merely importing this module does not evaluate (and
// potentially throw on) required variables. This matters on Cloudflare
// Workers, where the module graph is evaluated at startup for validation
// and runtime config is provided via bindings rather than process.env.
export const env = {
  get appId() {
    return required("APP_ID");
  },
  get appSecret() {
    return required("APP_SECRET");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get kimiAuthUrl() {
    return required("KIMI_AUTH_URL");
  },
  get kimiOpenUrl() {
    return required("KIMI_OPEN_URL");
  },
  get ownerUnionId() {
    return process.env.OWNER_UNION_ID ?? "";
  },
};
