# Cloudflare Workers: Production Variables

This file lists every environment variable the Tannelli app reads, so the Workers deployment works in production. Set values in the Cloudflare dashboard or with Wrangler. Never commit real values.

## Important: build-time vs runtime

- **`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle at build time.** They must be present when `yarn build` / `yarn deploy` runs, not only at runtime. In Cloudflare Workers Builds, add them under the build environment variables. If you deploy from your computer, set them in `.env.local` before running `yarn deploy`.
- **Other variables are read at runtime on the server.** Set them as Worker variables, or as secrets for sensitive values.

## Required variables

| Variable | Used for | Type | Where it's read |
|---|---|---|---|
| `NEXT_PUBLIC_PARSE_APP_ID` | Parse (Back4App) application ID | Plain (build-time) | `src/lib/parse/client.ts`, `src/lib/parse/admin.ts` |
| `NEXT_PUBLIC_PARSE_JS_KEY` | Parse JavaScript key | Plain (build-time) | `src/lib/parse/client.ts`, `src/lib/parse/admin.ts` |
| `NEXT_PUBLIC_PARSE_SERVER_URL` | Parse server URL, e.g. `https://parseapi.back4app.com/` | Plain (build-time) | `src/lib/parse/client.ts`, `src/lib/parse/admin.ts` |
| `PARSE_MASTER_KEY` | Parse master key for server-side admin writes | **Secret** | `src/lib/parse/admin.ts` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image URLs and uploads | Plain (build-time) | `src/lib/cloudinary.ts`, `src/lib/cloudinary-client.ts`, `src/app/api/cloudinary/sign/route.ts` |
| `CLOUDINARY_API_KEY` | Cloudinary API key for signed uploads | Plain | `src/lib/cloudinary.ts`, `src/app/api/cloudinary/sign/route.ts` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret for signing uploads | **Secret** | `src/lib/cloudinary.ts` |
| `NVIDIA_API_KEY` | NVIDIA AI API key used by the server-side engine | **Secret** | `src/lib/ruddge/engine.ts` |

## Optional variables

| Variable | Used for | Type | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_ENABLE_WATERMARK` | Turns the image watermark on when set to `true` | Plain (build-time) | Read in `src/lib/cloudinary-client.ts`. Defaults to off. |

## Present in local files but not read by the app

These are in `.env.local` or `.env.example`, but no code in `src/` reads them. You do not need to set them in Cloudflare.

- `PARSE_CLIENT_KEY`
- `CLOUDINARY_URL` (the app uses the separate key and secret above)
- `DATABASE_URL` (the app stores data in Parse, not MySQL)

## Setting them with Wrangler (CLI)

```bash
# Secrets (encrypted, not visible after saving)
npx wrangler secret put PARSE_MASTER_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put NVIDIA_API_KEY
```

Plain Worker variables can go in `wrangler.jsonc` under `"vars"`. Do not put secrets there.

For `NEXT_PUBLIC_*` values, set them before `yarn deploy` in your shell or `.env.local`, because they are inlined at build time.

## Checklist before `yarn deploy`

- [ ] `NEXT_PUBLIC_PARSE_APP_ID`, `NEXT_PUBLIC_PARSE_JS_KEY`, `NEXT_PUBLIC_PARSE_SERVER_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` are set at build time
- [ ] `PARSE_MASTER_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NVIDIA_API_KEY` are stored as Cloudflare secrets
- [ ] `NEXT_PUBLIC_ENABLE_WATERMARK` is set to `true` or `false` if you want watermarking
- [ ] Your Parse server allows requests from your Workers domain
