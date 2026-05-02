# maps-lead-service

## Local dev (host)

Install dependencies:

```bash
bun install
```

Run the API:

```bash
bun run dev
```

## Docker (app + postgres)

1. Update .env.docker with your Google Places key and service API key.
2. Build and start containers:

```bash
docker compose up --build -d
```

3. Run migrations (manual):

```bash
docker compose exec app bun run db:migrate
```

4. Access the API:

- Health: http://localhost:3000/health
- Scrape: http://localhost:3000/v1/scrape/google-places

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
