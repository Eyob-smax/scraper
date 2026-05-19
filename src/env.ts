function requireEnv(name: string): string {
  const value = Bun.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  PORT: Number(Bun.env.PORT ?? 3000),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  APIFY_API_TOKEN: requireEnv("APIFY_API_TOKEN"),
  SERVICE_API_KEY: requireEnv("SERVICE_API_KEY"),
};
