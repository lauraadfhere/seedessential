# Cloudflare Workers: Production Variables

Worker: `seedessential` · Custom domain: `https://seedessential.eu.cc` · Stack: vinext (`cloudflare.config.ts` + `vite.config.ts`)

## Why the deployed site showed "Missing Parse configuration"

`NEXT_PUBLIC_*` values are **frozen into the browser JavaScript when the app is built**. Cloudflare Workers Builds does **not** give the build step the dashboard *runtime* variables — those exist only inside the running Worker. Your Parse and Cloudinary values were set as runtime variables, and `.env.local` is gitignored so the build never saw it. The result: server-rendered HTML had the Cloudinary URLs, but the browser bundle had `undefined`, so hydration threw.

`src/lib/public-config.ts` now supplies those public identifiers as fallbacks, so the bundle always has them and an environment variable still overrides them. This removes the dependency on dashboard build variables.

## Required at build time (now built in)

| Variable | Value source | Notes |
|---|---|---|
| `NEXT_PUBLIC_PARSE_APP_ID` | fallback in `src/lib/public-config.ts` | Public by design |
| `NEXT_PUBLIC_PARSE_JS_KEY` | fallback in `src/lib/public-config.ts` | Public by design |
| `NEXT_PUBLIC_PARSE_SERVER_URL` | fallback in `src/lib/public-config.ts` | `https://parseapi.back4app.com/` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | fallback in `src/lib/public-config.ts` | `n08p7st8` |
| `NEXT_PUBLIC_ENABLE_WATERMARK` | fallback (`false`) | Set to `true` to turn the watermark on |

If you prefer to keep them out of source, set them as **Build variables and secrets** in the dashboard (Settings → Build) and they will override the fallbacks. Runtime variables are not enough for that.

## Required at runtime (encrypted secrets)

| Variable | Used for | Read by |
|---|---|---|
| `PARSE_MASTER_KEY` | privileged server-side Parse writes | `src/lib/parse/admin.ts` |
| `CLOUDINARY_API_KEY` | signed uploads | `src/lib/cloudinary.ts`, `src/app/api/cloudinary/sign/route.ts` |
| `CLOUDINARY_API_SECRET` | signing uploads | `src/lib/cloudinary.ts` |
| `NVIDIA_API_KEY` | AI engine | `src/lib/ruddge/engine.ts` |

```bash
npx wrangler secret put PARSE_MASTER_KEY
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put NVIDIA_API_KEY
```

Secrets are not part of the deployed configuration, so they never cause a drift conflict and they survive every deploy.

Unused, safe to drop: `PARSE_CLIENT_KEY`, `CLOUDINARY_URL`, `DATABASE_URL` — no code reads them.

## Fixing the deploy conflict

The abort was `wrangler` refusing to overwrite the remote configuration with a different local one. Two differences:

1. **Custom domain** — now declared in `cloudflare.config.ts` as `domains: ["seedessential.eu.cc"]`, matching the remote route.
2. **Plaintext `vars`** in the dashboard (the Parse and Cloudinary credentials). The config file declares no vars, so every deploy wants to delete them and aborts under `--strict`.

Resolve it once, in the dashboard (Settings → Variables and Secrets):

- **Delete** every plaintext variable: `NEXT_PUBLIC_*`, `PARSE_MASTER_KEY`, `PARSE_CLIENT_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`.
- **Recreate the four runtime values above as Secrets.** Secrets are not shown in the drift diff, so the conflict disappears.
- Do not put the master key or API secret in a `NEXT_PUBLIC_*` name or in `wrangler` vars.

Also remove `wrangler.response-store.jsonc` from the deploy path if it is still configured as the project's build command; the current Worker is a single vinext Worker.

## Rotate the exposed credentials

The Cloudinary API secret, Cloudinary URL, Parse master key and Parse client key were printed in plaintext in the build log (and shared in chat). Treat them as compromised:

1. Roll the Cloudinary API key/secret in the Cloudinary console.
2. Roll the Parse master key in the Back4App app settings.
3. Update the local `.env.local`, then `wrangler secret put` the new values.
4. Keep `.env*` untracked; check git history for any earlier commit of real values.

The Parse application id, JavaScript key and server URL, and the Cloudinary cloud name are public identifiers — they ship to every browser by design. They are not secrets, but the master key and API secret are.

## Checklist before deploying

- [ ] `node_modules` installed and `yarn build:vinext` succeeds locally
- [ ] `yarn dev:vinext` loads `/en` with no console errors
- [ ] Plaintext dashboard variables removed; four secrets created
- [ ] `domains` entry present in `cloudflare.config.ts`
- [ ] Credentials rotated
- [ ] After deploy: open `https://seedessential.eu.cc/en`, check the console, then test sign-in, product images, cart and upload
