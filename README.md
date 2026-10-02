# FlashBack

A browser photobooth built with React, TypeScript, Vite, Tailwind CSS, and Lucide icons. Capture up to ten photos, retake frames, select your favorites, customize a photo strip, record a session video, and save or download memories.

## Run locally

Requires Node.js 20.19+ (or 22.12+) and npm.

```sh
npm ci
npm run dev
```

Solo photography works without environment variables or a hosted backend. Camera access requires HTTPS or localhost. Allow camera permission when prompted. Video recording depends on MediaRecorder support; unsupported browsers still support photos.

## Device gallery

Photos, strips, videos, titles, favorites, and the current draft persist in IndexedDB in the current browser. Gallery controls support search, category/favorite filters, playback, download, rename, reuse of strip templates, and confirmed deletion. Saving the same media again updates its existing record.

This is device-local storage, not a cloud account: it does not sync between browsers or devices. Browser storage can be cleared or evicted. Download backups. There is no signup/login UI in this project.

## Optional long-distance sessions

The repository contains a Supabase integration but no hosted Supabase project or deployment credentials. Long-distance controls show an explicit unavailable state until configured; they do not simulate another participant.

To enable them:

1. Use the existing Supabase project if one is available. Otherwise provision a project only when you want to enable this feature.
2. Apply the SQL migrations in `supabase/migrations/` in chronological order. The last migration replaces the original public-access policies with participant-only access and an atomic invitation claim.
3. Enable **Anonymous Sign-Ins** in Supabase Auth. Anonymous participants receive private persisted identities without a signup screen. Configure rate limits/captcha for a public deployment as appropriate.
4. Copy `.env.example` to `.env.local` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the project URL and publishable/anon key. Never put a service-role key or database password in a `VITE_` variable.
5. Restart the development server, create a couple session, and send its invite link to a different browser/device. An invitation has one partner place. Capture is host-controlled; both participants must connect their cameras. Each round waits for both photos before enabling the next one.

The server determines participant identities; the frontend does not infer roles from readiness flags. The invite UUID is needed to atomically join; nonparticipants cannot list/read/update shared photos. Supabase Realtime plus a polling fallback keeps the two clients updated. Clock accuracy and network latency affect capture synchronization.

Legacy rows without ownership are retained by the security migration but made inaccessible to frontend users. They need a deliberate administrative ownership assignment before they can be recovered; do not assign them to arbitrary visitors. Device gallery storage does not import the old publicly shared gallery.

Shared sessions and their SQL policies require live-backend verification before deploying this optional feature. They cannot be verified against a nonexistent backend.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Browser tests use a synthetic camera stream, exercise the actual application, and cover capture/retake, selection, customization, download, persistent gallery CRUD, favorites, videos after refresh, device isolation, unavailable-backend handling, denied camera permissions, navigation, and desktop/laptop/tablet/mobile layouts. No physical-camera or live shared-backend verification is implied.

## Deployment

No deployment target or CI configuration existed in the original repository. This repair adds `vercel.json` for Vercel deployment, with lint and type checks included in its build command. `npm run build` produces `dist/`, which can be served on any HTTPS static host. Navigation uses hash URLs so it does not require a server rewrite rule. If enabling Supabase, configure the two public environment variables before building and apply the migrations separately. Never commit `.env` files, dependency directories, or build output.

## Provision the long-distance backend

The backend uses the existing Supabase architecture: PostgreSQL for sessions and media, anonymous Auth identities for participant ownership, and Realtime with a polling fallback. It requires a hosted project; the Vercel frontend alone cannot persist shared sessions.

1. Sign in to Supabase and create a FlashBack project. Keep its database password outside this repository.
2. With the Supabase CLI installed, run `supabase login`, `supabase link --project-ref YOUR_PROJECT_REF`, and `supabase db push` from this directory. Apply **all** migrations, including `20261002010000_server_capture.sql`. Alternatively, execute the migration files in order in the project's SQL editor. Never stop after the original permissive migrations.
3. Enable Anonymous Sign-Ins in the hosted project's Auth settings. The checked-in `supabase/config.toml` enables it for local CLI development; it does not change hosted settings automatically. See [Supabase anonymous authentication](https://supabase.com/docs/guides/auth/auth-anonymous).
4. Set the two public variables from `.env.example` in Vercel's Production environment and redeploy. Set the Auth site URL to the final HTTPS deployment URL. Never use a service-role key in the frontend.
5. Run `node --env-file=.env.local scripts/check-backend.mjs` against a test project first. This creates three anonymous identities, verifies create/join/ownership/third-participant denial/capture/persist/retrieve/complete/delete, and removes its test session. Anonymous identities remain for the project's normal cleanup policy. It needs no administrative key.
6. Verify two separate browser profiles/devices through the UI: create an invite, join once, enable both cameras, capture all rounds, retrieve the final strip, refresh, and confirm an unrelated third browser cannot see the session. The backend smoke test does not replace this camera/UI check.

Server capture deadlines come from PostgreSQL. Client clocks and connectivity still affect when frames arrive. Anonymous identities persist within a browser; clearing its site data loses access. This is participant authentication without a permanent account or cross-device gallery sync. Private shared images remain in the database until deleted by the host or administrator; configure retention appropriate to your deployment before collecting real sessions at scale.

Local backend testing requires Docker and the Supabase CLI: `supabase start`, then `supabase db reset`. The hosted backend has not been verified until credentials are configured and the backend tests actually pass.
