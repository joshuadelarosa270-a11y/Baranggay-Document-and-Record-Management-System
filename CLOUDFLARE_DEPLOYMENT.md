# Cloud-only Barangay Wawa deployment

Implemented: no demo accounts/seeded records, one staff login at /staff-login.html,
role-based dashboards, Supabase Auth and database requests, and an overview-only
landing page. No secret/service-role credential is included. Old browser records
are ignored and preserved, not migrated.

## Required database installation (not yet performed)

The connected Supabase account has no access to project cfqivrhbuwxuqyjqyehx.
Reconnect using an account with project access, then inspect existing public
tables before running supabase/setup.sql. This is a fresh-installation script:
it stops on conflicting table/function names and must not be rerun blindly.
It creates the staff, resident, request and audit tables, RLS policies,
version-checked transaction RPC, registration and audit triggers.
SQL execution and live RLS testing are pending.

## First administrator and staff accounts

Create/invite each real staff user through Supabase Authentication using their
own email. They set their own password through the normal Supabase flow.
After the user exists, run the following in SQL Editor with the correct email
and name. Confirm exactly one row was inserted.

```sql
insert into public.bdrms_staff (id, name, role)
select id, 'YOUR STAFF NAME', 'admin'
from auth.users where lower(email) = lower('YOUR STAFF EMAIL');
```

Use secretary or staff for operational staff. Admin is read-only monitoring.
No browser client can grant staff access. Do not share passwords in SQL or chat.

## Residents

Enable email/password Auth and confirmation emails. Configure the Cloudflare URL
in Supabase Auth URL Configuration. Resident profiles start pending; staff must
approve them. Passwords go only to Supabase Auth, never to resident records.

Staff can create walk-in registry records without passwords. They are registry
records, not login accounts. Reconcile/link existing walk-in records before the
same person registers online; automatic matching and migration are not included.

## Validation before production

Run node --test tests/cloud.test.cjs and node scripts/build-cloudflare.cjs.
Tests mock HTTP; they do not verify live SQL or RLS.

On the live project test all roles, pending/rejected residents, cross-resident
access denial, approval/payment forgery denial, admin write denial, stale edits,
request lifecycle, audit entries and shared records on two devices. Run Supabase
security/performance advisors after installing the schema.

## Cloudflare Pages

For the current workers.dev deployment, use the repository-root wrangler.jsonc.
Build command: node scripts/build-cloudflare.cjs
Deploy command: npx wrangler deploy
The Wrangler config builds and uploads only ./dist. Do not override it with
--assets . or upload the repository root. After deployment, /staff-login.html
is the admin/staff entry. A staff account entered on the resident form is also
routed according to its database staff role, without a public role selector.

The table below is for an alternative Pages deployment.

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | main |
| Build command | node scripts/build-cloudflare.cjs |
| Build output directory | dist |

Complete database installation and live verification before using real records.
Only app assets go into dist. SQL, tests, documents and development files are
excluded. The previously shared legacy service-role key must be revoked/rotated
separately in Supabase API Keys.

