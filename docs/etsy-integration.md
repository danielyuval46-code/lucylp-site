# LucyLP Etsy Integration

The Books & Comics page keeps `data/products.js` as the editorial override layer.
Live Etsy data is fetched only through the Cloudflare Pages Function at `/api/etsy`.

## Cloudflare Environment Variables

Add these variables in Cloudflare Pages:

- `ETSY_API_KEY`
- `ETSY_SHOP_ID`
- `ETSY_SHARED_SECRET` optional, reserved for OAuth flows
- `ETSY_ACCESS_TOKEN` optional, used when Etsy requires OAuth for shop data
- `ETSY_REFRESH_TOKEN` optional, reserved for token-refresh support

Do not add these values to GitHub or frontend JavaScript.

## API Route

Browser route:

```text
/api/etsy
```

Source file:

```text
functions/api/etsy.js
```

The function requests Etsy Open API v3 shop active listings with pagination and
normalizes the public response to:

```json
{
  "id": "etsy-123",
  "title": "Listing title",
  "description": "Listing description",
  "price": "1.99",
  "currency": "USD",
  "image": "https://i.etsystatic.com/...",
  "buyUrl": "https://www.etsy.com/listing/...",
  "status": "available",
  "tags": ["lucylp-comic"],
  "section": "Lucy in Japan",
  "collection": "lucy-in-japan",
  "updatedAt": "2026-07-17T00:00:00.000Z",
  "provider": "etsy"
}
```

The response also includes `diagnostics` for Daniel's validation report. It does
not include API keys, tokens, shared secrets, private account data, or raw Etsy
credentials.

## Mapping

Preferred mapping uses controlled Etsy tags:

- `lucylp-comic` -> `lucy-in-japan`
- `lucylp-guide` -> `lucylp-guides-activity-books`
- `lucylp-book` -> `lucylp-guides-activity-books`
- `lucylp-shop` -> `shop`

Fallback mapping uses Etsy shop section names:

- `Lucy in Japan`, `Comics`, `Books & Comics` -> `lucy-in-japan`
- `Baby Vintage School`, `Guides`, `Books` -> `lucylp-guides-activity-books`
- `Shop` -> `shop`

Listings without controlled tags or known sections are returned as `shop` and
are not automatically featured on Books & Comics.

## Local Editorial Overrides

Use `data/products.js` for:

- LucyLP collection
- editorial title and subtitle
- page count
- language
- display order
- coming-soon products
- Lemon Squeezy products
- products not yet listed on Etsy

To bind a local product to a live Etsy listing, add an optional `etsyListingId`
field to that local product record. The frontend also supports matching by a
stable Etsy response `id` when an Etsy tag such as `lucylp-id-product-slug` is
used.

## Fallback Behavior

If `/api/etsy` is unavailable, unconfigured, rate-limited, expired, or empty,
`books/books.js` renders the local `data/products.js` products and leaves cards
without valid `buyUrl` as `COMING SOON`.
