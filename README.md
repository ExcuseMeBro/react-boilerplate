# React Boilerplate

Clean starter for React apps that talk to REST APIs.

## What is inside?

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4
- Redux Toolkit for app state
- TanStack Query for server state
- REST API client with JWT support
- i18n: English, Uzbek, and Russian
- Biome instead of ESLint and Prettier
- Remotion animation + video render setup

## Start

```bash
npm install
cp .env.example .env
npm run dev
```

App runs on `http://localhost:3000`.

## Main commands

```bash
npm run dev             # start dev server
npm run build           # type-check and build
npm run check           # Biome lint + format check
npm run check:write     # auto-fix safe Biome issues
npm run audit           # security audit
npm run remotion:studio # open Remotion Studio
npm run remotion:render # render sample video
```

## REST API config

`.env`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_AUTH_STRATEGY=bearer
VITE_REQUEST_TIMEOUT_MS=15000
```

Auth endpoints expected by default:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

Todo example endpoints:

- `GET /todos`
- `POST /todos`
- `PATCH /todos/:id`
- `DELETE /todos/:id`

## JWT note

For production, prefer server-set `httpOnly`, `Secure`, `SameSite` cookies. If backend requires bearer JWTs, set `VITE_AUTH_STRATEGY=bearer` and frontend sends `Authorization: Bearer <token>`.

## Project structure

```text
src/
  components/       shared UI
  config/           env config
  features/         feature modules: auth, todos
  layouts/          app layouts
  locales/          i18n dictionaries
  pages/            route pages
  plugins/          i18n setup
  remotion/         video compositions
  services/         REST client and token storage
  store/            Redux Toolkit store
```

## Add new feature

1. Create `src/features/<name>`.
2. Add `types.ts` and `service.ts`.
3. Use `api.get/post/put/patch/delete` from `src/services/http.ts`.
4. Add page or components.
5. Add translation keys in `en.json`, `uz.json`, and `ru.json`.

## No GraphQL

This boilerplate is REST-first. GraphQL packages and config are intentionally not included.
