<div align="center">

# ⚡ React Boilerplate

**Build faster. Start cleaner.**

A modular, REST-first React starter powered by [Vite+](https://viteplus.dev/).

[![React](https://img.shields.io/badge/React_19-151923?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_6-151923?style=for-the-badge&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org/)
[![Vite+](https://img.shields.io/badge/Vite%2B_1.5-151923?style=for-the-badge&logo=vite&logoColor=BD34FE)](https://viteplus.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-151923?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com/)

**Typed APIs · Secure auth patterns · EN / UZ / RU · GitHub Actions CI**

</div>

---

## 🚀 Quick start

**Node 22.18+ + npm 11.16.0** (CI uses Node 22). See [.node-version](.node-version) and [engine ranges](package.json).

```sh
python3 scripts/bootstrap.py --name my-app --dry-run
python3 scripts/bootstrap.py --name my-app
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. No global `vp` required. This is a **frontend starter**: live auth/Todo data needs your own backend.

## Bootstrap a new project

Python 3.9+ is required only for bootstrap/testing; the CLI has no dependencies.
Run `python3 scripts/bootstrap.py --name my-app [--dry-run]` from any directory.
The name is a 1–64 character lowercase slug starting with a letter; digits and
single internal hyphens are allowed. Paths, shell syntax, whitespace and reserved
device names are rejected before writes.

Bootstrap updates `package.json`, both root names in `package-lock.json`,
`index.html`'s title and `app.name` in EN/UZ/RU. React has no native application
ID. Demo copy is otherwise unchanged. It creates `.env` from `.env.example`
with owner-only permissions **only when absent**, including preserving existing
or dangling symlinks. It never reads existing environment files, installs
dependencies, generates credentials, renames directories, changes Git remotes or
touches other credentials. `VITE_*` values are public, not secrets.

Dry-run lists changed filenames, never values; repeating the same name is a no-op.
Malformed or linked config files are rejected during preflight. Run on a trusted,
idle checkout: replacement is atomic per file, not a multi-file transaction; do
not run concurrent bootstrap/edit processes. On interruption, rerun the same name.
Review the diff and run `npm run verify` after configuration.

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

## Continuous integration

[GitHub Actions](.github/workflows/ci.yml) runs on pull requests and pushes to
`dev`. It uses `.node-version`, npm 11.16.0 from `packageManager`, `npm ci`
and an npm download cache keyed by OS/architecture, resolved Node/npm versions
and the lockfile. It does not cache `node_modules`. Actions are commit-pinned,
permissions are read-only, checkout credentials are not retained and no production
secrets are required. There are no ignored failures or audit threshold exemptions.

Run the same gates locally:

```sh
npm ci
npm run check
npm test
python3 -m unittest discover -s scripts -p 'test_*.py' -v
npm run build
node scripts/bundle-size.mjs dist --assert-lazy
npm run audit
```

## Route chunks

Home and the layout remain eager. `/todos` and `/animation` use React Router
lazy imports with shared localized loading/recovery states. During navigation the
current page and navbar stay visible. A failed chunk offers a full reload (useful
after deployment) or home navigation, without showing internal exception details.
Direct entry still requires your static host's SPA fallback.

See [the reproducible production bundle comparison](docs/bundle-size.md).
`npm run build` emits a manifest; `scripts/bundle-size.mjs` sums only the
entry's transitive **static** JS imports, excluding lazy chunks, CSS and assets.
The optional `--assert-lazy` fails if either route is eager or shares one chunk.

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

Run `npm ci && npm run verify`, then upload **`dist/`** to your static host over HTTPS. Route `/api/*` to your backend **before** the SPA fallback; other frontend routes should serve `index.html`. Configure CORS/cookies and CSP/HSTS/frame restrictions on your servers. Production source maps are disabled; dev/preview are not production servers. No cloud provider is required; the CI workflow verifies changes but does not deploy them.
