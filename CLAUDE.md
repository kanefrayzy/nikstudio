# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independently-run applications in one repo — there is no root package manager or build orchestration:

- `backend_laravel/` — Laravel 12 / PHP 8.2 headless JSON API + media storage (PostgreSQL).
- `frontend_next/` — Next.js 15 (App Router) / React 19 public site **and** the `/admin` CMS.

The frontend consumes the backend over HTTP at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Laravel's Blade/Vite setup is vestigial — all UI lives in Next.js.

Code comments, commit messages, and user-facing strings are largely in Russian; follow the surrounding language when editing a file.

## Commands

### Backend (`cd backend_laravel`)

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan storage:link          # REQUIRED — all media is served from /storage
php artisan db:seed               # HomeContent, HomepageContent, MediaPage, ProjectCategory, ProjectDetail

php artisan serve                 # http://localhost:8000
composer run dev                  # serve + queue:listen + pail (log tail) + vite, concurrently

composer test                     # config:clear then artisan test
php artisan test --filter=ChangePasswordTest          # single test class
php artisan test tests/Unit/LoginWithRememberMeTest.php
./vendor/bin/pint                 # formatter
```

Tests run against a **separate PostgreSQL database `nik_studio_test`** (hardcoded in `phpunit.xml`); create it with `createdb nik_studio_test` and `php artisan migrate --env=testing --force` before the first run. See `TESTING-GUIDE.md`.

### Frontend (`cd frontend_next`)

```bash
npm install
npm run dev                       # http://localhost:3000
npm run build && npm start        # output: 'standalone'
npm run lint
npm run analyze                   # bundle analyzer (Windows-style `set ANALYZE=true`)
```

`NEXT_PUBLIC_API_URL` must be set (no `.env` file is committed); several modules throw outright when it is missing.

**Caveat on test scripts:** `package.json` declares `test` (vitest), `test:e2e` and friends (playwright), but **neither `vitest.config.*`/`playwright.config.*` nor a `tests/e2e/` directory exists in the repo.** The ~40 spec files under `src/test/` (plus `src/lib/__tests__`, `src/components/__tests__`) rely on a jsdom environment and `src/test/setup.ts`, so `npm test` will not work until a vitest config is added. Don't assume these scripts pass; verify before relying on them.

## Architecture

### Auth (admin CMS)

Laravel Sanctum personal access tokens, **not** session cookies:

1. `POST /api/login` (`throttle:3,5`) returns a bearer token; the frontend stores it in a plain `admin-token` cookie (`src/lib/auth.ts`, `src/lib/api.ts`).
2. `src/middleware.ts` guards `/admin/:path*` by checking that the cookie merely exists — real authorization happens server-side on every API call.
3. Every protected route is wrapped in `['auth:sanctum', 'refresh.token']`. `RefreshTokenMiddleware` silently rotates a token that expires within 30 minutes and returns the replacement in the `X-New-Token` / `X-Token-Expires-At` response headers (exposed via `config/cors.php`); the axios client in `src/lib/api.ts` picks these up. Adding a protected route without `refresh.token` breaks silent renewal.

CSRF is disabled for `api/*` (`bootstrap/app.php`) because auth is bearer-token based.

### API surface

All routes live in a single flat `routes/api.php` (~270 lines). The consistent shape is: public `GET` outside the middleware group, mutations inside `Route::middleware(['auth:sanctum','refresh.token'])`. Responses are `{ success, data, message }` envelopes.

Two conventions that recur and are easy to get wrong:

- **File uploads use `POST` even for updates**, because `FormData` + `PUT` doesn't survive PHP. Many resources register both `POST /{id}` and `PUT /{id}` pointing at the same controller method (media groups, testimonials, process steps, project blocks).
- **Ordering** is exposed as explicit endpoints — `/{id}/move-up`, `/{id}/move-down`, `/{id}/order`, `/bulk-order`, `/reorder` — rather than being inferred from payload order.

### Content model

The CMS is split across three unrelated storage strategies; know which one a page uses before editing:

1. **Key/value CMS** — `homepage_content` table: rows of `(section, content_key, content_type, content_value, order_index, metadata)`. The frontend reads them via `getContentValue(content, key, fallback)` / `getImageUrl` in `src/lib/homepage-content.ts`. Sections are string-numbered (`services_1..7`, `testimonials_1..6`, `hero`, `main_content`, `gallery_box`). Adding a field = adding a row, not a migration.
2. **Structured entities** — `Project` → `ProjectDetail` → `ProjectDetailBlock` → `ProjectDetailBlockMedia`. Block media is grouped by `group_id` with `group_type` `single`/`double` so two files render as one paired unit; `ProjectDetailBlock.gallery_layout` (default `carousel`) chooses the renderer (see `src/app/components/CollageGallery.tsx`, `CarouselWithLightbox.tsx`). Blog posts follow the same block pattern (`BlogPost` → `BlogPostBlock`).
3. **Media page** — its own dedicated tables (`MediaPageContent`, `MediaService`, `MediaServiceFeature`, `MediaServiceMedia`, `MediaTestimonial`, `MediaProcessStep`) with a public read-through endpoint `GET /api/public/media-page` plus a cache-refresh endpoint.

### Заявки с сайта (contact form)

`POST /api/contact/send` и `/api/contact/project` (обе формы — один компонент `src/components/ContactForm.tsx`). Порядок в `ContactController::handleInquiry`: проверка `SpamGuard` → запись в `contact_requests` → Telegram → письмо. Заявка сохраняется **до** отправки, поэтому отказ почты или Telegram не теряет лид и не даёт ошибку посетителю; статусы каналов лежат в `mail_sent`/`mail_error` и `telegram_sent`/`telegram_error`.

`SpamGuard` не отбрасывает спам, а помечает `is_spam` + `spam_reason` и пропускает уведомления — ответ при этом обычный, успешный. Сигналы: скрытое поле `website`, метка `form_loaded_at` (быстрее 3 с — бот) и балльные эвристики (порог 3). При правке порогов помните: ложно отброшенный клиент дороже пропущенного спама.

`trustProxies` в `bootstrap/app.php` обязателен — без него за nginx `request->ip()` даёт `127.0.0.1`, и `throttle:3,1` на контактных роутах становится общим лимитом для всех посетителей сразу.

### Media handling

Uploads land in `storage/app/public` and are served through the `storage` symlink. Paths returned by the API are inconsistent (`/storage/...`, `storage/app/public/...`, bare relative) — **always** normalize through `getMediaUrl()` in `src/lib/media-utils.ts` rather than concatenating URLs. Any new host serving images must also be added to `images.remotePatterns` in `next.config.ts` or `next/image` will refuse it.

Video is streamed by `VideoStreamController` (`GET /api/video/{path}`) with HTTP Range support and path-traversal guards; it is registered as the *first* route in `api.php` deliberately.

### Caching / revalidation

Public pages fetch server-side with per-route ISR windows (`next: { revalidate: N }` — blog 3600s, project detail 1800s, homepage `0`). After an admin save, the client calls `POST /api/revalidate` (`src/app/api/revalidate/route.ts`) with the affected path; this endpoint is unauthenticated and takes an arbitrary path. Admin-side reads use SWR (`src/lib/swr-config.tsx`, `src/hooks/use*.ts`) with `revalidateOnFocus: false`.

### Cross-browser compatibility layer

A large, self-contained subsystem in `src/lib/` — `browser-detection`, `polyfill-manager`/`polyfill-optimizer`, `*-compatibility` modules (media, event, touch, keyboard, mouse, responsive, form-validation, file-upload), `graceful-degradation`, plus `CompatibleImage`/`CompatibleVideo`/`CompatibleDialog` components and provider components. Most of the test suite targets this layer. `next.config.ts` pairs with it: manual `splitChunks` groups (fullcalendar, apexcharts, swiper, radix, core-js polyfills) and a `webpack.DefinePlugin` `BROWSER_SUPPORT` flag. Prefer the `Compatible*` components over raw `<img>`/`<video>` in shared UI.

### Styling

Tailwind v4 via `@tailwindcss/postcss` (there is also a legacy v3-style `tailwind.config.js` supplying the `inter`/`cabin`/`geometria` font families). Radix primitives + `class-variance-authority` + `tailwind-merge` in `src/components/ui/`.
