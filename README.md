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
