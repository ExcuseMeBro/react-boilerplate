<div align="center">

# ⚡ React Boilerplate

**Build faster. Start cleaner.**

A modular, REST-first React starter powered by [Vite+](https://viteplus.dev/).

[![React](https://img.shields.io/badge/React_19-151923?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_6-151923?style=for-the-badge&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org/)
[![Vite+](https://img.shields.io/badge/Vite%2B_1.1-151923?style=for-the-badge&logo=vite&logoColor=BD34FE)](https://viteplus.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-151923?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com/)

**Typed APIs · Secure auth patterns · EN / UZ / RU · No GitHub CI/CD**

</div>

---

## 🚀 Quick start

**Node 24 LTS + npm 11** recommended. See [.node-version](.node-version) and [engine ranges](package.json).

```sh
npm ci
cp .env.example .env
npm run dev
```

Open **http://127.0.0.1:3000**. No global `vp` required. This is a **frontend starter**: live auth/Todo data needs your own backend.

## ✨ Built for real projects

| Layer              | Tools                                                              |
| ------------------ | ------------------------------------------------------------------ |
| Toolchain          | Vite+ · Rolldown · Oxfmt · Oxlint · Vitest                         |
| UI                 | React 19 · TypeScript 6 · Tailwind 4 · Motion                      |
| Data & forms       | TanStack Query · Redux Toolkit · React Hook Form                   |
| Routing & language | React Router · i18next · English / Uzbek / Russian                 |
| API & auth         | Scoped REST client · cookie/bearer modes · cancellation & timeouts |

## 🛠️ Daily commands

```sh
npm run dev          # Develop
npm run check:write  # Format + fix lint issues; review changes
npm test             # Run tests (test:watch for watch mode)
npm run verify       # Format/lint/types + tests + build + audit
npm run build        # Production output → dist/
npm run preview      # Local preview → :4173, not a production server
```

## 🔌 Connect your API

Defaults in [.env.example](.env.example):

```dotenv
VITE_API_URL=/api
VITE_AUTH_STRATEGY=cookie
VITE_REQUEST_TIMEOUT_MS=15000
```

Use an HTTPS API in production; `http://localhost:8080/api` is allowed for development. **`VITE_*` values are public, build-time configuration — never secrets.** Dev/preview bind to loopback; optional host/port overrides are in the example.

```ts
import { api } from "@/services/http";

const todos = await api.get<Todo[]>("/todos", { signal });
await api.post("/todos", { title: "Ship something great" });
```

Paths stay under the configured API base; out-of-scope URLs and redirects are blocked. JSON, FormData, text and empty responses are supported; non-2xx responses throw `ApiError`. Pass Query's `signal` into services to preserve cancellation.

## 🛡️ Secure defaults, clear boundaries

- Prefer backend-set **HttpOnly + Secure + SameSite** cookies. The backend must enforce authorization, CSRF/origin validation and explicit credentialed CORS — never wildcard origins. Pass required CSRF headers through `RequestOptions.headers`.
- Bearer tokens are **memory-only**: no localStorage or Redux token payloads. Reload requires login/refresh; Redux DevTools are disabled to avoid exposing login credentials. Do not add unredacted action logging.
- Failed server logout clears local state, **not** an HttpOnly server cookie; retry server logout as needed. Memory storage does not prevent XSS, and audits cannot guarantee zero risk.

<details>
<summary><strong>📖 Backend contract & extension guide</strong></summary>

**Auth:** `POST /auth/login` accepts `{ email, password }`; login/refresh return `{ user: { id, name, email }, accessToken? }` (token required in bearer mode). `GET /auth/me` returns the user; `POST /auth/logout` returns empty/204. `POST /auth/refresh` needs a backend-managed refresh cookie. Dispatch `loadCurrentUser()` for cookie restoration or `refreshSession()` for bearer restoration; automatic refresh and route guards are not bundled.

**Todos:** `GET /todos` returns `[{ id, title, completed }]`; `POST /todos` takes `{ title }`; `PATCH /todos/:id` takes `{ completed }`; both return a todo. `DELETE /todos/:id` returns empty/204. Adapt [feature services](src/features) to your backend; TypeScript types are not runtime response validation.

**Extend:** add `src/features/<name>/{types,service}.ts`, then a [page](src/pages), [route](src/router) and keys in all three [locale dictionaries](src/locales). Keep server state in Query and client state in Redux. Add colocated tests using `vite-plus/test`.

**Toolchain:** unified [vite.config.ts](vite.config.ts), `@/` source alias. Keep `vite-plus`, the `vite` core alias and its override aligned; commit the lockfile and rerun `npm ci` + `npm run verify` after upgrades.

</details>

## 📦 Deploy anywhere

Run `npm ci && npm run verify`, then upload **`dist/`** to your static host over HTTPS. Route `/api/*` to your backend **before** the SPA fallback; other frontend routes should serve `index.html`. Configure CORS/cookies and CSP/HSTS/frame restrictions on your servers. Production source maps are disabled; dev/preview are not production servers. No cloud provider or GitHub workflow required.
