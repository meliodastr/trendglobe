# TrendGlobe Production-Auto (Solo-operator Ready)

This project is designed to run mostly hands-off:
- Collects signals from multiple sources (connectors)
- Scores and ranks trends
- Generates AI explanations (multi-model ensemble)
- Generates SEO reports automatically
- Provides Help Center answers with citations from docs
- Health endpoint + GitHub Action for uptime alerts

## Run locally

### 1) API server
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2) Worker (automation)
In another terminal:
```bash
npm run worker
```

### 3) Web
Serve `web/` with any static server:
```bash
cd ../web
python -m http.server 5173
```

Set `CORS_ORIGIN` accordingly.

## Production deployment
- Deploy `server` to a Node host (Render/Fly.io/VM) and `web` to a static host.
- Replace FILE storage with Postgres (STORE=PG). See `schema.sql`.
- Configure JWT auth (AUTH_MODE=JWT) or integrate Supabase.
- Configure AI provider env vars.
- Configure alert delivery (Email + Telegram + Web Push).

> Legal templates are provided in `web/legal/*`. Get them reviewed by counsel.
