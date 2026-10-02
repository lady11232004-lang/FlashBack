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

The production deployment uses the FlashBack Supabase project (`focuohhiktlvkhvkhsci`) for private shared sessions. Local checkouts need the two public environment variables from `.env.example`. Without them, long-distance controls show an explicit unavailable state.

To enable them:

1. Use the existing Supabase project if one is available. Otherwise provision a project only when you want to enable this feature.
2. Apply the SQL migrations in `supabase/migrations/` in chronological order. The last migration replaces the original public-access policies with participant-only access and an atomic invitation claim.
3. Enable **Anonymous Sign-Ins** in Supabase Auth. Anonymous participants receive private persisted identities without a signup screen. Configure rate limits/captcha for a public deployment as appropriate.
4. Copy `.env.example` to `.env.local` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the project URL and publishable/anon key. Never put a service-role key or database password in a `VITE_` variable.
5. Restart the development server, create a couple session, and send its invite link to a different browser/device. An invitation has one partner place. Capture is host-controlled; both participants must connect their cameras. Each round waits for both photos before enabling the next one.

The server determines participant identities; the frontend does not infer roles from readiness flags. The invite UUID is needed to atomically join; nonparticipants cannot list/read/update shared photos. Supabase Realtime plus a polling fallback keeps the two clients updated. Clock accuracy and network latency affect capture synchronization.

Legacy rows without ownership are retained by the security migration but made inaccessible to frontend users. They need a deliberate administrative ownership assignment before they can be recovered; do not assign them to arbitrary visitors. Device gallery storage does not import the old publicly shared gallery.

The live backend lifecycle/security smoke test and a two-browser synthetic-camera session have been verified. They cover joining, three capture rounds, media recovery after refresh, and shared strip generation. Real device camera timing still depends on connectivity and browser behavior.

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

Production is hosted at https://flashback-bay.vercel.app. This repair adds `vercel.json` for Vercel deployment, with lint and type checks included in its build command. `npm run build` produces `dist/`, which can be served on any HTTPS static host. Navigation uses hash URLs so it does not require a server rewrite rule. If enabling Supabase, configure the two public environment variables before building and apply the migrations separately. Never commit `.env` files, dependency directories, or build output.

## Provision the long-distance backend

The backend uses the existing Supabase architecture: PostgreSQL for sessions and media, anonymous Auth identities for participant ownership, and Realtime with a polling fallback. It requires a hosted project; the Vercel frontend alone cannot persist shared sessions.

1. Sign in to Supabase and create a FlashBack project. Keep its database password outside this repository.
2. With the Supabase CLI installed, run `supabase login`, `supabase link --project-ref YOUR_PROJECT_REF`, and `supabase db push` from this directory. Apply **all** migrations, including `20261002010000_server_capture.sql`. Alternatively, execute the migration files in order in the project's SQL editor. Never stop after the original permissive migrations.
3. Enable Anonymous Sign-Ins in the hosted project's Auth settings. The checked-in `supabase/config.toml` enables it for local CLI development; it does not change hosted settings automatically. See [Supabase anonymous authentication](https://supabase.com/docs/guides/auth/auth-anonymous).
4. Set the two public variables from `.env.example` in Vercel's Production environment and redeploy. Set the Auth site URL to the final HTTPS deployment URL. Never use a service-role key in the frontend.
5. Run `node --env-file=.env.local scripts/check-backend.mjs` against a test project first. This creates three anonymous identities, verifies create/join/ownership/third-participant denial/capture/persist/retrieve/complete/delete, and removes its test session. Anonymous identities remain for the project's normal cleanup policy. It needs no administrative key.
6. Verify two separate browser profiles/devices through the UI: create an invite, join once, enable both cameras, capture all rounds, retrieve the final strip, refresh, and confirm an unrelated third browser cannot see the session. The backend smoke test does not replace this camera/UI check.

Server capture deadlines come from PostgreSQL. Client clocks and connectivity still affect when frames arrive. Anonymous identities persist within a browser; clearing its site data loses access. This is participant authentication without a permanent account or cross-device gallery sync. Private shared images remain in the database until deleted by the host or administrator; configure retention appropriate to your deployment before collecting real sessions at scale.

Local backend testing requires Docker and the Supabase CLI: `supabase start`, then `supabase db reset`. Run the hosted backend smoke test after every SQL change. To exercise the two-browser flow, set `FLASHBACK_BACKEND_TEST=1` when running `npm test`; this also skips the intentionally unavailable-backend scenario.


## Rooms, frames, and Safari rendering

Choose a room at `#rooms` or during long-distance setup. The eight choices are Classic, Vintage, Meme, Laundry, Prison, Subway, Airplane, and Karaoke. Rooms decorate the booth surroundings and suggest a matching frame; they do not remove/replace the real camera background. A shared session stores its room choice so both participants see the same surroundings.

In the strip editor, open **FRAME** to choose from 43 original presets across Simple, Patterns, Collage, Travel, Food, Fall, Winter, Memes, and Themes. The thumbnails are generated by the same renderer as the exported strip. Frame artwork is baked into the saved/downloaded JPEG and the choice survives refresh. Choosing a custom background clears the preset frame. The existing templates still control photo layout and photographic styling; Classic, Minimal, and Date Stamp preserve the chosen camera colors.

Camera frames now fill their outer container without the old bottom gap. Filters use a pixel-rendering fallback when Canvas 2D filters are unavailable, so Safari exports keep the selected color effects. Grain applies an actual noise layer, and 35mm film adds texture. WebKit export tests can be run with `PLAYWRIGHT_BROWSER=webkit npm test -- tests/rendering.spec.ts --grep 'filters|every template'` after `npx playwright install webkit`.

The database includes `20261002020000_room_choice.sql` for shared room validation and immutable room ownership. The production schema was applied through the Supabase SQL editor. Before using CLI migration deployment on this existing project, reconcile the CLI migration history with those already-applied files; do not blindly reapply their triggers/policies. Keep all migrations for new environments.

Solo and long-distance capture expose the same filter, template, and frame catalogs. Long-distance photos are limited to a 1280-pixel longest edge at JPEG quality 0.82 to reduce transfer and processing cost; solo originals retain camera resolution. Unchanged shared sessions poll only their timestamp. The countdown is displayed immediately, concurrent round completion is guarded, and a failed photo upload can be retried without recapturing. Couple setup uses a wide desktop layout and stacks on mobile. Added Ocean, Garden, Sunset, Galaxy, Birthday, Wedding, Rainy Day, and Love Letter frame themes.
