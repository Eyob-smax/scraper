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
  GOOGLE_PLACES_API_KEY: requireEnv("GOOGLE_PLACES_API_KEY"),
  SERVICE_API_KEY: requireEnv("SERVICE_API_KEY"),
};
