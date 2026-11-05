# Tannelli platform architecture

## MVP delivery order

1. Launch catalog, search, cart, checkout, orders and delivery tracking.
2. Add expert profiles, request matching, bookings, messaging and written recommendations.
3. Add projects, care schedules, solution bundles and B2B workflows.

## Roles

`customer` shops, creates projects and requests advice. `expert` manages services, availability and recommendations. `seller` owns products and fulfils marketplace orders. `support` resolves cases. `admin` moderates all content, users, payouts and reports.

## API surface

- `GET /api/catalog/products`, `GET /api/catalog/products/:slug`, `POST /api/cart/items`, `POST /api/checkout`
- `GET /api/orders`, `GET /api/orders/:number/tracking`, `PATCH /api/orders/:number/tracking`
- `GET /api/experts`, `POST /api/expert-requests`, `GET /api/consultations`, `POST /api/consultations`
- `GET|POST /api/projects`, `GET /api/projects/:id/tasks`, `POST /api/projects/:id/tasks`, `PATCH /api/projects/:id/tasks/:taskId`, `DELETE /api/projects/:id/tasks/:taskId`
- `GET|POST|DELETE /api/wishlist`
- `POST /api/cloudinary/sign` for direct signed browser uploads.

All mutating endpoints require a session, validate role ownership server-side, use idempotency keys for checkout, and accept only an allow-listed Cloudinary folder per user role.

## Cloudinary

The app is already configured for signed direct uploads. Add `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to `.env.local`. Store the returned `public_id` and `secure_url` in `media_assets`; never store the secret in browser code. Folder conventions are `tannelli/products`, `guides`, `experts`, `projects`, `consultation-requests`, and `reports`.

## MySQL

Run [`database/schema.sql`](database/schema.sql) against MySQL 8.0+. The schema keeps images in Cloudinary, structured commerce in relational tables, and flexible care/availability payloads in JSON columns.
