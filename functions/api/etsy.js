const ETSY_API_BASE = "https://openapi.etsy.com/v3/application";
const DEFAULT_LIMIT = 100;
const MAX_PAGES = 20;
const CACHE_SECONDS = 1800;
const REQUEST_TIMEOUT_MS = 9000;
const shopIdCache = new Map();
const ALLOWED_ORIGINS = new Set([
  "https://lucylp.com",
  "https://www.lucylp.com"
]);

const TAG_COLLECTIONS = {
  "lucylp-comic": "lucy-in-japan",
  "lucylp-guide": "lucylp-guides-activity-books",
  "lucylp-book": "lucylp-guides-activity-books",
  "lucylp-shop": "shop"
};

const SECTION_COLLECTIONS = {
  "lucy in japan": "lucy-in-japan",
  comics: "lucy-in-japan",
  "books & comics": "lucy-in-japan",
  "baby vintage school": "lucylp-guides-activity-books",
  guides: "lucylp-guides-activity-books",
  books: "lucylp-guides-activity-books",
  shop: "shop"
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildHeaders(request, { cacheControl: "no-store" })
    });
  }

  if (request.method !== "GET") {
    return jsonResponse(request, {
      ok: false,
      provider: "etsy",
      products: [],
      diagnostics: { error: "Method not allowed" }
    }, {
      status: 405,
      cacheControl: "no-store",
      extraHeaders: { allow: "GET, OPTIONS" }
    });
  }

  const config = getConfig(env);
  const missingConfig = getMissingConfig(config);

  if (missingConfig.length) {
    return jsonResponse(request, buildEmptyPayload({
      error: "Etsy integration is not configured.",
      missingConfig
    }), {
      status: 503,
      cacheControl: "no-store"
    });
  }

  try {
    await ensureShopId(config);
    const shopSections = await fetchShopSections(config);
    const listingsResult = await fetchAllActiveListings(config);
    const products = await normalizeListings(config, listingsResult.listings, shopSections);
    const activeProducts = products.filter((product) => product.status === "available");

    return jsonResponse(request, {
      ok: true,
      provider: "etsy",
      shopId: config.shopId,
      products: activeProducts,
      diagnostics: {
        shopId: config.shopId,
        activeListingsReturned: activeProducts.length,
        rawListingsReturned: listingsResult.listings.length,
        totalAvailableFromEtsy: listingsResult.total,
        pagesFetched: listingsResult.pagesFetched,
        paginationComplete: listingsResult.paginationComplete,
        listingsWithoutImages: activeProducts
          .filter((product) => !product.image)
          .map((product) => product.providerListingId),
        listingsWithoutMappingTags: activeProducts
          .filter((product) => product.mapping.source !== "tag")
          .map((product) => product.providerListingId),
        shopIdSource: config.shopIdSource,
        tokenRefreshStatus: config.tokenRefreshStatus
      }
    }, {
      cacheControl: `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`
    });
  } catch (error) {
    return jsonResponse(request, buildEmptyPayload({
      error: "Live Etsy feed unavailable.",
      apiStatus: error instanceof EtsyApiError ? error.status : ""
    }), {
      status: 502,
      cacheControl: "no-store"
    });
  }
}

function getConfig(env) {
  return {
    apiKey: env.ETSY_API_KEY || "",
    sharedSecret: env.ETSY_SHARED_SECRET || "",
    shopId: env.ETSY_SHOP_ID || "",
    shopName: env.ETSY_SHOP_NAME || "",
    shopIdSource: env.ETSY_SHOP_ID ? "env" : "",
    accessToken: env.ETSY_ACCESS_TOKEN || "",
    refreshToken: env.ETSY_REFRESH_TOKEN || "",
    tokenRefreshStatus: "not-attempted"
  };
}

function getMissingConfig(config) {
  return [
    ["ETSY_API_KEY", config.apiKey],
    ["ETSY_SHOP_ID or ETSY_SHOP_NAME", config.shopId || config.shopName]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

async function ensureShopId(config) {
  if (config.shopId) {
    config.shopId = sanitizeNumericId(config.shopId);
    config.shopIdSource = "env";
    return;
  }

  const shopName = sanitizeText(config.shopName);

  if (!shopName) {
    return;
  }

  const cacheKey = shopName.toLowerCase();
  const cached = shopIdCache.get(cacheKey);

  if (cached) {
    config.shopId = cached;
    config.shopIdSource = "resolved-cache";
    return;
  }

  const url = new URL(`${ETSY_API_BASE}/shops`);
  url.searchParams.set("shop_name", shopName);

  const data = await etsyFetchJson(url, config);
  const shops = Array.isArray(data.results) ? data.results : [];
  const exactShop = shops.find((shop) => {
    return String(shop.shop_name || "").toLowerCase() === cacheKey;
  });
  const resolvedShop = exactShop || shops[0];
  const resolvedShopId = sanitizeNumericId(resolvedShop?.shop_id);

  if (!resolvedShopId) {
    throw new EtsyApiError("Etsy shop name did not resolve to a shop ID", 404);
  }

  shopIdCache.set(cacheKey, resolvedShopId);
  config.shopId = resolvedShopId;
  config.shopIdSource = "resolved-name";
}

async function fetchAllActiveListings(config) {
  const listings = [];
  let offset = 0;
  let total = null;
  let pagesFetched = 0;

  while (pagesFetched < MAX_PAGES) {
    const url = new URL(`${ETSY_API_BASE}/shops/${encodeURIComponent(config.shopId)}/listings/active`);
    url.searchParams.set("limit", String(DEFAULT_LIMIT));
    url.searchParams.set("offset", String(offset));

    const data = await etsyFetchJson(url, config);
    const results = Array.isArray(data.results) ? data.results : [];
    total = Number.isFinite(data.count) ? data.count : total;
    listings.push(...results);
    pagesFetched += 1;

    if (!results.length || results.length < DEFAULT_LIMIT) {
      break;
    }

    offset += DEFAULT_LIMIT;

    if (total !== null && listings.length >= total) {
      break;
    }
  }

  return {
    listings,
    total: total ?? listings.length,
    pagesFetched,
    paginationComplete: total === null ? listings.length < DEFAULT_LIMIT : listings.length >= total
  };
}

async function fetchShopSections(config) {
  try {
    const url = new URL(`${ETSY_API_BASE}/shops/${encodeURIComponent(config.shopId)}/sections`);
    const data = await etsyFetchJson(url, config);
    const sections = Array.isArray(data.results) ? data.results : [];

    return new Map(sections.map((section) => [
      String(section.shop_section_id || ""),
      sanitizeText(section.title || section.name || "")
    ]));
  } catch (_error) {
    return new Map();
  }
}

async function normalizeListings(config, listings, shopSections) {
  const imageEntries = await Promise.all(
    listings.map(async (listing) => {
      const listingId = String(listing.listing_id || "");
      return [listingId, await fetchPrimaryImage(config, listingId)];
    })
  );
  const imagesByListing = new Map(imageEntries);

  return listings.map((listing) => {
    const listingId = String(listing.listing_id || "");
    const tags = normalizeTags(listing.tags);
    const sectionName = shopSections.get(String(listing.shop_section_id || "")) || "";
    const mapping = mapListingToCollection(tags, sectionName);
    const image = imagesByListing.get(listingId) || "";
    const price = normalizePrice(listing.price);
    const buyUrl = sanitizeEtsyUrl(listing.url);

    return {
      id: getStableId(listing, tags),
      providerListingId: listingId,
      title: sanitizeText(listing.title),
      description: sanitizeText(listing.description),
      price,
      currency: normalizeCurrency(listing.price),
      image,
      buyUrl,
      status: listing.state === "active" && buyUrl ? "available" : "coming-soon",
      tags,
      section: sectionName,
      collection: mapping.collection,
      updatedAt: timestampToIso(listing.updated_timestamp || listing.last_modified_timestamp || listing.state_timestamp),
      provider: "etsy",
      state: sanitizeText(listing.state),
      quantity: Number.isFinite(listing.quantity) ? listing.quantity : null,
      mapping
    };
  });
}

async function fetchPrimaryImage(config, listingId) {
  if (!listingId) {
    return "";
  }

  try {
    const url = new URL(`${ETSY_API_BASE}/listings/${encodeURIComponent(listingId)}/images`);
    const data = await etsyFetchJson(url, config);
    const images = Array.isArray(data.results) ? data.results : [];
    const primary = images
      .slice()
      .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0))[0];

    return sanitizeImageUrl(
      primary?.url_fullxfull ||
      primary?.url_570xN ||
      primary?.url_170x135 ||
      ""
    );
  } catch (_error) {
    return "";
  }
}

async function etsyFetchJson(url, config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = {
      "x-api-key": config.apiKey,
      accept: "application/json"
    };

    if (config.accessToken) {
      headers.authorization = `Bearer ${config.accessToken}`;
    }

    let response = await fetch(url.toString(), {
      headers,
      signal: controller.signal
    });

    if (response.status === 401 && config.refreshToken) {
      config.accessToken = await refreshAccessToken(config);
      headers.authorization = `Bearer ${config.accessToken}`;
      config.tokenRefreshStatus = "refreshed";
      response = await fetch(url.toString(), {
        headers,
        signal: controller.signal
      });
    }

    if (!response.ok) {
      throw new EtsyApiError(`Etsy request failed with ${response.status}`, response.status);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

class EtsyApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "EtsyApiError";
    this.status = status;
  }
}

async function refreshAccessToken(config) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.apiKey,
    refresh_token: config.refreshToken
  });

  const response = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json"
    },
    body
  });

  if (!response.ok) {
    config.tokenRefreshStatus = "failed";
    throw new Error(`Etsy token refresh failed with ${response.status}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    config.tokenRefreshStatus = "failed";
    throw new Error("Etsy token refresh did not return an access token");
  }

  return data.access_token;
}

function mapListingToCollection(tags, sectionName) {
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const controlledTag = normalizedTags.find((tag) => TAG_COLLECTIONS[tag]);

  if (controlledTag) {
    return {
      collection: TAG_COLLECTIONS[controlledTag],
      source: "tag",
      value: controlledTag
    };
  }

  const sectionKey = Object.keys(SECTION_COLLECTIONS).find((key) => {
    return sectionName.toLowerCase().includes(key);
  });

  if (sectionKey) {
    return {
      collection: SECTION_COLLECTIONS[sectionKey],
      source: "section",
      value: sectionName
    };
  }

  return {
    collection: "shop",
    source: "unmapped",
    value: ""
  };
}

function getStableId(listing, tags) {
  const productIdTag = tags.find((tag) => tag.toLowerCase().startsWith("lucylp-id-"));

  if (productIdTag) {
    return productIdTag.slice("lucylp-id-".length);
  }

  return `etsy-${String(listing.listing_id || "").trim()}`;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map(sanitizeText)
    .filter(Boolean)
    .slice(0, 20);
}

function normalizePrice(price) {
  if (!price) {
    return "";
  }

  if (typeof price === "string") {
    return price;
  }

  if (price.amount !== undefined && price.divisor) {
    const amount = Number(price.amount) / Number(price.divisor);
    return amount.toFixed(2);
  }

  if (price.value !== undefined) {
    return String(price.value);
  }

  return "";
}

function normalizeCurrency(price) {
  if (!price || typeof price === "string") {
    return "";
  }

  return sanitizeText(price.currency_code || price.currency || "");
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function sanitizeNumericId(value) {
  const id = String(value || "").trim();
  return /^\d+$/.test(id) ? id : "";
}

function sanitizeImageUrl(value) {
  return sanitizeUrl(value, ["https:"], ["i.etsystatic.com", "img0.etsystatic.com"]);
}

function sanitizeEtsyUrl(value) {
  return sanitizeUrl(value, ["https:"], ["www.etsy.com", "etsy.com"]);
}

function sanitizeUrl(value, protocols, hosts) {
  try {
    const url = new URL(String(value || ""));
    const hostname = url.hostname.toLowerCase();

    if (!protocols.includes(url.protocol)) {
      return "";
    }

    if (!hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return "";
    }

    return url.toString();
  } catch (_error) {
    return "";
  }
}

function timestampToIso(timestamp) {
  const value = Number(timestamp);

  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return new Date(value * 1000).toISOString();
}

function buildEmptyPayload(diagnostics) {
  return {
    ok: false,
    provider: "etsy",
    shopId: "",
    products: [],
    diagnostics: {
      shopId: "",
      activeListingsReturned: 0,
      rawListingsReturned: 0,
      totalAvailableFromEtsy: 0,
      pagesFetched: 0,
      paginationComplete: false,
      listingsWithoutImages: [],
      listingsWithoutMappingTags: [],
      shopIdSource: "",
      tokenRefreshStatus: "not-attempted",
      ...diagnostics
    }
  };
}

function jsonResponse(request, body, options = {}) {
  return new Response(JSON.stringify(body), {
    status: options.status || 200,
    headers: buildHeaders(request, {
      cacheControl: options.cacheControl || `public, max-age=${CACHE_SECONDS}`,
      extraHeaders: options.extraHeaders
    })
  });
}

function buildHeaders(request, options = {}) {
  const origin = request.headers.get("origin") || "";
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": options.cacheControl || `public, max-age=${CACHE_SECONDS}`,
    vary: "Origin",
    ...(options.extraHeaders || {})
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "GET, OPTIONS";
    headers["access-control-allow-headers"] = "content-type";
  }

  return headers;
}
