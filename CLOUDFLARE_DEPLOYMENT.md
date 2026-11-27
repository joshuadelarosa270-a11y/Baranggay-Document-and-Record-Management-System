# Barangay Wawa: Cloudflare and Supabase

Status: Cloudflare build preparation and public Supabase configuration only.
The existing app still uses local browser storage and demo logins. It is not yet
connected to Supabase Auth or shared database records. Do not use real resident
data until that integration and access-control verification are complete.

## Supabase project

- Project reference: `cfqivrhbuwxuqyjqyehx`
- Project URL: `https://cfqivrhbuwxuqyjqyehx.supabase.co`
- Public configuration: `js/supabase-config.js` (not yet consumed by the app)
- No secret or service-role credential is stored in this repository.

The connected Supabase account currently cannot access this project. Reconnect
Supabase using an account with access to this project before schema inspection,
database changes and Auth integration. Existing browser data is not migrated.
Rotate/revoke the previously shared legacy service-role credential in Supabase.
Creating a new publishable key alone does not revoke a legacy service-role key.

## Cloudflare Pages Git integration

Connect the existing GitHub repository in Cloudflare Workers & Pages, then use:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | main |
| Build command | node scripts/build-cloudflare.cjs |
| Build output directory | dist |

These source changes must be pushed to GitHub before Cloudflare can build them.
No deployment or Git push has been performed by this setup.

## Direct upload alternative

Run `node scripts/build-cloudflare.cjs` in the project folder. Upload only the
contents of `dist` through Cloudflare Pages direct upload. Do not upload the
project root: it contains development files and presentation documents.
Direct Upload projects cannot later switch to Git integration without creating
a new Pages project.

## Before production use

1. Connect the correct Supabase account and inspect the existing schema.
2. Implement Supabase Auth; remove browser password checks and demo credentials.
3. Add database tables and row-level access for residents, secretary and admin.
4. Connect registration, requests, approvals and logs to the database.
5. Configure the deployed website URL in Supabase Auth URL Configuration.
6. Verify access rules and shared records with different accounts and devices.

Official references:
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://supabase.com/docs/guides/getting-started/api-keys
