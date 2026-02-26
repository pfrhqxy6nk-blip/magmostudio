# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Telegram Lead Notifications

This repo includes a Vercel Function that forwards new Supabase `requests` to Telegram:
- `api/supabase-requests-to-telegram.js`

Setup (recommended):
1. In Supabase create a Database Webhook on table `public.requests` for event `INSERT`.
2. Webhook URL: `https://<your-vercel-domain>/api/supabase-requests-to-telegram`
3. Add a custom header `x-webhook-secret` with the same value as `SUPABASE_WEBHOOK_SECRET`.

Vercel Environment Variables (Production):
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `SUPABASE_WEBHOOK_SECRET` (optional but recommended)

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
