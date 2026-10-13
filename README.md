# React Boilerplate

Reusable REST-first React starter with [Vite+](https://viteplus.dev/): one toolchain for development, builds, formatting, linting and tests. No GitHub CI/CD workflows, pre-commit hooks or agent setup required.

## Stack

React 19, TypeScript 6, Vite+ 1.1 (Vite/Rolldown, Oxfmt, Oxlint and Vitest), Tailwind CSS 4, Redux Toolkit, TanStack Query, React Router, React Hook Form, Motion and i18next (English, Uzbek, Russian).

## Start

Use **Node 24 LTS** (`.node-version` pins 24.11.0) and npm 11. Node 22.18+ is also supported; see `package.json` for engine ranges.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:3000`. A global `vp` installation is **not required**: npm scripts use the pinned local Vite+ binary. This is a frontend starter, not a bundled backend: the home and animation pages run independently; the Todo example needs the REST API below. The default `/api` endpoint expects your own reverse proxy/backend. For a separate local backend, set `VITE_API_URL=http://localhost:8080/api` and configure its CORS policy.

## Commands

| Command               | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Local Vite+ development server                             |
| `npm run check`       | Oxfmt formatting, Oxlint linting and type checks           |
| `npm run check:write` | Format and apply lint fixes (review changes)               |
| `npm run typecheck`   | Standalone TypeScript check                                |
| `npm test`            | Non-watch unit tests via Vite+                             |
| `npm run test:watch`  | Interactive test watch mode                                |
| `npm run build`       | Type-check, then produce `dist/`                           |
| `npm run preview`     | Local build preview on port 4173 (not a production server) |
| `npm run audit`       | Audit the entire dependency tree, including dev tooling    |
| `npm run verify`      | Check, test, build and audit together                      |

`vite.config.ts` contains the unified configuration and the `@/` source alias. `vite` is an npm alias to the matching Vite+ core, with an override to prevent plugin dependencies from installing a second Vite. Keep `vite-plus`, the core alias and override aligned when upgrading. Commit the lockfile and rerun `npm ci` + `npm run verify` after dependency changes. Biome configuration and scripts have been replaced.

## Configuration

Copy `.env.example`, then set only what your deployment needs:

```dotenv
VITE_API_URL=/api
VITE_AUTH_STRATEGY=cookie
VITE_REQUEST_TIMEOUT_MS=15000
```

- API base: same-origin absolute path (e.g. `/api`), or HTTP(S) URL. Absolute production APIs must use HTTPS. Credentials, query strings and fragments in the API base are rejected.
- Auth: `cookie` (recommended) or `bearer`. Unknown values and invalid timeouts fail early.
- Optional local bind/port overrides: `VITE_DEV_HOST`, `VITE_DEV_PORT`, `VITE_PREVIEW_PORT`. Loopback-only by default; avoid exposing dev/preview servers on untrusted networks.
- **Every `VITE_*` variable is public, embedded at build time. Never put secrets in it.** Rebuild when configuration changes. `.env` files are ignored except the example.

## Backend contract

Adapt `src/features/*/service.ts` to your backend. Types are compile-time contracts, not runtime response validation: add schemas if untrusted responses require validation.

| Endpoint                                      | Response                                      |
| --------------------------------------------- | --------------------------------------------- |
| `POST /auth/login` with `{ email, password }` | `{ user: { id, name, email }, accessToken? }` |
| `GET /auth/me`                                | `{ id, name, email }`                         |
| `POST /auth/refresh`                          | Same shape as login                           |
| `POST /auth/logout`                           | Empty / 204                                   |
| `GET /todos`                                  | `[{ id, title, completed }]`                  |
| `POST /todos` with `{ title }`                | Created todo                                  |
| `PATCH /todos/:id` with `{ completed }`       | Updated todo                                  |
| `DELETE /todos/:id`                           | Empty / 204                                   |

Login and refresh require `accessToken` only in bearer mode. The backend must set/rotate a refresh cookie if refresh is supported; no client-managed refresh token is stored. Dispatch `loadCurrentUser()` for cookie session restoration, or `refreshSession()` for bearer restoration when your backend supports it. There is no automatic retry/refresh loop or route guard; wire these into your application's startup and access policy.

## API usage

```ts
import { api } from "@/services/http";

const user = await api.get<User>("/users/123", { signal });
await api.post("/users", { name: "Ada" });
await api.get<string>("/health", { responseType: "text", auth: false });
```

Paths resolve **under the configured API base**, not under the site root. Absolute URLs must stay within that same base. Cross-origin URLs, traversal outside the base, credential-bearing URLs and redirects are blocked, even with `auth: false`. Timeout remains active during body consumption and composes with caller cancellation. JSON is the default; `FormData`, empty/204/205 and explicit text responses are supported. Non-2xx responses throw `ApiError` with `status` and optional `{ message, code, errors }`. Network/abort/parse errors remain distinguishable.

## Authentication and security

- Prefer server-set **HttpOnly, Secure, SameSite** session/refresh cookies. Cookie auth sends credentials to the configured API. Cross-origin credentialed APIs need an explicit allowed frontend origin and `Access-Control-Allow-Credentials: true`, never wildcard CORS.
- Bearer access tokens are **memory-only**, not persisted in `localStorage`, Redux state or fulfilled action payloads. Reloading loses the access token until an explicit refresh/login. Redux DevTools are disabled because thunk arguments include login credentials; do not add action logging without redaction.
- Bearer requests omit cookies by default; auth endpoints explicitly include refresh/session cookies. On logout the local token/user are cleared even if the server fails, but the error is surfaced: an HttpOnly server cookie cannot be cleared by JavaScript, so retry server logout as needed.
- Cookie protection is a **backend responsibility**: use appropriate SameSite policy plus origin/CSRF validation on state-changing endpoints. Pass your backend's CSRF header via `RequestOptions.headers` (including on login/refresh/logout if required by that backend); the starter cannot invent your CSRF protocol.
- Memory-only tokens reduce persistent exposure, but do not prevent XSS. Avoid unsafe HTML, validate backend input, use least-privilege authorization and production security headers. Audits only report currently known dependency advisories; no zero-risk guarantee.

## Deploy without GitHub CI/CD

```sh
npm ci
npm run verify
# Upload dist/ to your static host.
```

Use HTTPS. Serve static assets directly; route frontend history URLs (e.g. `/todos`) to `index.html`. Route `/api/*` to the backend **before** the SPA fallback, never return HTML for API requests. If using an absolute API origin, configure CORS/cookies there. Development and preview servers are not production servers. Production source maps are disabled by default. Configure CSP, HSTS, frame restrictions and other headers at your host; a suitable CSP depends on your API origin and the integrations you add.

## Structure and extension

```text
src/
  components/     shared UI
  config/         validated public environment
  features/       auth and todos: types, services, state, tests
  layouts/        app layouts
  locales/        en/uz/ru dictionaries
  pages/          route pages
  plugins/        i18n setup
  router/         route definitions
  services/       scoped HTTP client and memory token storage
  store/          Redux setup (app/client state)
```

Create `src/features/<name>/{types,service}.ts`; use TanStack Query for server state, Redux for client state, and React Hook Form for forms. Add routes and translations in all three dictionaries. Pass Query's `signal` into service calls so unmount/invalidation cancellation reaches fetch. Add tests beside each module using `vite-plus/test`; run `npm run verify`. Optional auth/animation/demo features can be removed alongside their dependencies when not needed. No GraphQL or opinionated backend/cloud provider is required.
