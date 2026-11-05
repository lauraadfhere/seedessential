# Tannelli user access

## Roles

- **Customer:** browse public catalog and guides; manage only their profile, addresses, cart, orders, projects, consultation requests, messages and reviews.
- **Expert:** customer permissions plus their own availability, profile, services, consultations, recommendations and earnings.
- **Seller:** manage only their own catalog, inventory and fulfilment records.
- **Support:** view customer/order records needed to resolve a ticket; cannot alter payments, roles or seller payouts.
- **Admin:** platform-wide management of catalog, users, experts, content, promotions, deliveries, reports and moderation.

## Enforcement

Role access must be enforced in server-side API handlers using the authenticated Parse user and the `role` field on `_User`. The browser must never receive the Parse Master Key. Public catalog classes may be read publicly; all customer, order, project, consultation and payment writes must require an authenticated user and ownership check.

## Parse setup

`scripts/parse-schema.mjs` provisions the role field on `_User`. Before releasing real user data, configure Parse Class-Level Permissions and object ACLs according to the ownership rules above, then expose privileged operations through server-side routes using `src/lib/parse/admin.ts` only.
