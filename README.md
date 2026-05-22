# lucylp-site
LucyLP is a vinyl collector platform focused on rare records, market trends, and music nostalgia.

## Cloudflare Pages eBay API

The live marketplace sections use a Cloudflare Pages Function at `/api/ebay`.
Set these Cloudflare environment secrets before deploying:

- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`

The browser never receives these secrets. It only calls `/api/ebay`, which fetches
live eBay Browse API results server-side and returns sanitized item data.
