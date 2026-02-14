# TrendGlobe — Production-ready (Solo Operator) Starter

This starter gives you a deployable baseline:
- Static web app with language switch (EN/TR/ES)
- Express API with server-side Pro gating
- Automated worker: multi-source collection + scoring + multi-model AI summaries
- Automated SEO report generator (+ report endpoints)
- Help Center with AI answers citing your docs
- Uptime monitor via GitHub Actions + Telegram notifications

## Start
1) Start API and worker: see `server/README.md`
2) Serve `web/` folder

## What you still must do
- Configure a real Auth provider (Supabase/Clerk) and set AUTH_MODE=JWT
- Configure Stripe subscriptions and persist plan status server-side
- Review legal templates with counsel
- Add compliance details (cookie banner, DPA/subprocessors list)
