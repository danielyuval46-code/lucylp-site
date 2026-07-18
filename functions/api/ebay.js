const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope';
const DEFAULT_MARKETPLACE_ID = 'EBAY_US';

const AFFILIATE_PARAMS = {
  mkcid: '1',
  mkrid: '711-53200-19255-0',
  siteid: '0',
  campid: '5339154057',
  customid: 'LucyLPnew',
  toolid: '10001',
  mkevt: '1'
};
const REQUIRED_AFFILIATE_PARAMS = [
  'campid',
  'customid',
  'mkcid',
  'toolid',
  'mkevt'
];

const SECTION_QUERIES = {
  'pink-floyd': 'Pink Floyd vinyl LP record',
  'the-beatles': 'The Beatles vinyl LP record',
  'japanese-pressings': 'Japan pressing vinyl LP obi record',
  'colored-vinyl': 'colored vinyl LP record',
  'new-finds': 'vinyl LP record newly listed'
};

const SECTION_LIMIT = 6;
const SECTION_LIMITS = {
  stylus: 8
};
const SEARCH_LIMIT = 30;
const FALLBACK_THRESHOLD = 3;
const RELAXED_THRESHOLD = 4;
const DEFAULT_QUERY = SECTION_QUERIES['new-finds'];
const FALLBACK_QUERIES = {
  'pink-floyd': 'Pink Floyd vinyl LP',
  'the-beatles': 'The Beatles vinyl LP',
  'japanese-pressings': 'Japan vinyl LP obi',
  'colored-vinyl': 'colored vinyl LP',
  'new-finds': 'vinyl LP record'
};
const CATEGORY_TO_SECTION = {
  'pink-floyd': 'pink-floyd',
  pinkfloyd: 'pink-floyd',
  'the-beatles': 'the-beatles',
  beatles: 'the-beatles',
  'japanese-pressings': 'japanese-pressings',
  japanese: 'japanese-pressings',
  'colored-vinyl': 'colored-vinyl',
  colored: 'colored-vinyl',
  'new-finds': 'new-finds',
  new: 'new-finds'
};
const VINYL_INCLUDE_GROUPS = [
  ['vinyl', 'lp', 'record', 'album']
];
const GLOBAL_EXCLUDE_TERMS = [
  'funko',
  'doll',
  'toy',
  'figure',
  'plush',
  'cassette',
  'dvd'
];
const GENERIC_VINYL_EXCLUDE_TERMS = [
  ...GLOBAL_EXCLUDE_TERMS,
  'cd',
  'book',
  'poster'
];
const POSTER_EXCLUDE_TERMS = [
  'toy',
  'doll',
  'funko',
  'plush'
];
const STYLUS_EXCLUDE_TERMS = [
  'toy',
  'doll',
  'poster',
  'cd',
  'dvd',
  'cassette',
  'book'
];
const SECTION_FILTERS = {
  'pink-floyd': {
    includeGroups: [
      ['pink floyd'],
      ...VINYL_INCLUDE_GROUPS
    ],
    exclude: GLOBAL_EXCLUDE_TERMS
  },
  'the-beatles': {
    includeGroups: [
      ['beatles'],
      ...VINYL_INCLUDE_GROUPS
    ],
    exclude: GLOBAL_EXCLUDE_TERMS
  },
  'japanese-pressings': {
    includeGroups: [
      ['japan', 'japanese', 'obi'],
      ...VINYL_INCLUDE_GROUPS
    ],
    exclude: GLOBAL_EXCLUDE_TERMS
  },
  'colored-vinyl': {
    includeGroups: [
      ['colored', 'colour', 'color', 'pink', 'red', 'blue', 'clear', 'splatter', 'marbled'],
      ...VINYL_INCLUDE_GROUPS
    ],
    exclude: GLOBAL_EXCLUDE_TERMS
  },
  'new-finds': {
    includeGroups: VINYL_INCLUDE_GROUPS,
    exclude: GENERIC_VINYL_EXCLUDE_TERMS
  }
};
const GENERIC_VINYL_FILTER = {
  includeGroups: VINYL_INCLUDE_GROUPS,
  exclude: GENERIC_VINYL_EXCLUDE_TERMS
};
const RELAXED_SECTION_FILTERS = {
  ...SECTION_FILTERS
};

function getSectionLimit(sectionKey) {
  return SECTION_LIMITS[sectionKey] || SECTION_LIMIT;
}

function jsonResponse(body, init = {}) {
  const { cacheControl = 'public, max-age=900', headers = {}, status = 200 } = init;

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
      ...headers
    }
  });
}

function appendAffiliateParams(itemUrl) {
  if (!itemUrl) {
    return '#';
  }

  try {
    const url = new URL(itemUrl, 'https://www.ebay.com');

    Object.entries(AFFILIATE_PARAMS).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const affiliateUrl = url.toString();
    return hasRequiredAffiliateParams(affiliateUrl) ? affiliateUrl : itemUrl;
  } catch (_error) {
    return itemUrl;
  }
}

function hasRequiredAffiliateParams(itemUrl) {
  try {
    const url = new URL(itemUrl, 'https://www.ebay.com');

    return REQUIRED_AFFILIATE_PARAMS.every((key) => {
      return url.searchParams.get(key) === AFFILIATE_PARAMS[key];
    });
  } catch (_error) {
    return false;
  }
}

function normalizeItem(item) {
  const price = item.price
    ? `${item.price.currency || 'USD'} ${item.price.value}`
    : '';
  const imageUrl =
    item.image?.imageUrl ||
    item.thumbnailImages?.[0]?.imageUrl ||
    '';

  return {
    itemId: item.itemId || '',
    title: item.title || 'LucyLP Collector Find',
    image: imageUrl,
    imageUrl,
    price,
    condition: item.condition || '',
    url: appendAffiliateParams(item.itemWebUrl)
  };
}

function getRealImageUrl(item) {
  return item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '';
}

function hasRealImage(item) {
  const imageUrl = getRealImageUrl(item);
  return Boolean(imageUrl) && !imageUrl.toLowerCase().includes('placeholder');
}

function getItemIdentity(item) {
  const itemId = String(item.itemId || '').trim().toLowerCase();

  if (itemId) {
    return `id:${itemId}`;
  }

  return `title:${String(item.title || '').trim().toLowerCase()}`;
}

function removeDuplicateItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    const identity = getItemIdentity(item);

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
}

function titleMatchesFilter(item, filter) {
  const title = String(item.title || '').toLowerCase();
  const includesRequiredTerms = filter.includeGroups.every((group) => {
    return group.some((term) => title.includes(term));
  });
  const includesExcludedTerm = filter.exclude.some((term) => title.includes(term));
  const includesConditionalExcludedTerm = (filter.excludeUnlessVinyl || []).some((term) => {
    return title.includes(term) && !title.includes('vinyl');
  });

  return includesRequiredTerms && !includesExcludedTerm && !includesConditionalExcludedTerm;
}

function isVinylQuery(query) {
  const normalizedQuery = String(query || '').toLowerCase();
  return ['vinyl', 'lp', 'record', 'album'].some((term) => normalizedQuery.includes(term));
}

function isStylusQuery(query) {
  const normalizedQuery = String(query || '').toLowerCase();
  return ['stylus', 'needle', 'cartridge'].some((term) => normalizedQuery.includes(term));
}

function filterItemsForSection(items, sectionKey, filters = SECTION_FILTERS) {
  const filter = filters[sectionKey];

  if (!filter) {
    return removeDuplicateItems(items.filter(hasRealImage));
  }

  return removeDuplicateItems(
    items
      .filter(hasRealImage)
      .filter((item) => titleMatchesFilter(item, filter))
  );
}

function filterGenericVinylItems(items) {
  return removeDuplicateItems(
    items
      .filter(hasRealImage)
      .filter((item) => titleMatchesFilter(item, GENERIC_VINYL_FILTER))
  );
}

function buildDiagnosticPayload(response, data) {
  const itemSummaries = data.itemSummaries || [];
  const firstItem = itemSummaries[0] || {};
  const firstImageUrl =
    firstItem.image?.imageUrl ||
    firstItem.thumbnailImages?.[0]?.imageUrl ||
    '';

  return {
    tokenOk: true,
    status: response.status,
    itemCount: itemSummaries.length,
    firstTitle: firstItem.title || '',
    firstImageUrl,
    items: itemSummaries.slice(0, SEARCH_LIMIT).map(normalizeItem)
  };
}

function buildCategoryPayload(response, sectionKey, items, debugCounts) {
  const firstItem = items[0] || {};

  return {
    tokenOk: true,
    status: response.status,
    category: sectionKey,
    categoryQueryUsed: debugCounts.categoryQueryUsed,
    rawCountBeforeFiltering: debugCounts.rawCountBeforeFiltering,
    filteredCountAfterFiltering: debugCounts.filteredCountAfterFiltering,
    itemCount: items.length,
    firstTitle: firstItem.title || '',
    firstImageUrl: firstItem.imageUrl || firstItem.image || '',
    items
  };
}

function getEnvDebug(env) {
  return {
    hasEbayClientId: Boolean(env.EBAY_CLIENT_ID),
    hasEbayClientSecret: Boolean(env.EBAY_CLIENT_SECRET),
    hasEbayMarketplaceId: Boolean(env.EBAY_MARKETPLACE_ID),
    hasEbaySellerUsername: Boolean(env.EBAY_SELLER_USERNAME)
  };
}

function getSecretValue(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '');
}

async function getAccessToken(env) {
  const clientId = getSecretValue(env.EBAY_CLIENT_ID);
  const clientSecret = getSecretValue(env.EBAY_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    throw new Error('Missing eBay API credentials');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: EBAY_SCOPE
  });

  const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    throw new Error(`eBay OAuth failed with ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

function getMarketplaceId(env) {
  return env.EBAY_MARKETPLACE_ID || DEFAULT_MARKETPLACE_ID;
}

async function fetchBrowseSummaries(accessToken, query, env) {
  const url = new URL(EBAY_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(SEARCH_LIMIT));
  url.searchParams.set('sort', 'newlyListed');

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-ebay-c-marketplace-id': getMarketplaceId(env)
    }
  });

  if (!response.ok) {
    throw new Error(`eBay Browse search failed with ${response.status}`);
  }

  const data = await response.json();

  return {
    response,
    itemSummaries: data.itemSummaries || []
  };
}

async function searchItems(accessToken, query, sectionKey, env) {
  const { itemSummaries } = await fetchBrowseSummaries(accessToken, query, env);

  return filterItemsForSection(itemSummaries, sectionKey)
    .slice(0, getSectionLimit(sectionKey))
    .map(normalizeItem);
}

async function searchCategory(accessToken, sectionKey, env) {
  const primary = await fetchBrowseSummaries(
    accessToken,
    SECTION_QUERIES[sectionKey],
    env
  );
  let itemSummaries = primary.itemSummaries;
  let queryUsed = SECTION_QUERIES[sectionKey];
  let filteredItems = filterItemsForSection(itemSummaries, sectionKey);

  if (filteredItems.length < FALLBACK_THRESHOLD && FALLBACK_QUERIES[sectionKey]) {
    const fallback = await fetchBrowseSummaries(accessToken, FALLBACK_QUERIES[sectionKey], env);
    itemSummaries = removeDuplicateItems([...itemSummaries, ...fallback.itemSummaries]);
    queryUsed = `${queryUsed} | fallback: ${FALLBACK_QUERIES[sectionKey]}`;
    filteredItems = filterItemsForSection(itemSummaries, sectionKey);
  }

  if (filteredItems.length < RELAXED_THRESHOLD) {
    const relaxedItems = filterItemsForSection(itemSummaries, sectionKey, RELAXED_SECTION_FILTERS);

    if (relaxedItems.length > filteredItems.length) {
      filteredItems = relaxedItems;
    }
  }

  const items = filteredItems.slice(0, getSectionLimit(sectionKey)).map(normalizeItem);

  return buildCategoryPayload(primary.response, sectionKey, items, {
    categoryQueryUsed: queryUsed,
    rawCountBeforeFiltering: itemSummaries.length,
    filteredCountAfterFiltering: filteredItems.length
  });
}

async function searchBrowseApi(accessToken, query, env) {
  const url = new URL(EBAY_SEARCH_URL);
  url.searchParams.set('q', query || DEFAULT_QUERY);
  url.searchParams.set('limit', String(SEARCH_LIMIT));
  url.searchParams.set('sort', 'newlyListed');

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-ebay-c-marketplace-id': getMarketplaceId(env)
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`eBay Browse search failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  let itemSummaries = data.itemSummaries || [];

  if (isStylusQuery(query)) {
    itemSummaries = filterItemsForSection(itemSummaries, 'stylus');
  } else if (isVinylQuery(query)) {
    itemSummaries = filterGenericVinylItems(itemSummaries);
  }

  return buildDiagnosticPayload(response, {
    ...data,
    itemSummaries
  });
}

export async function onRequest(context) {
  const { env, request } = context;
  const envDebug = getEnvDebug(env);

  if (request.method !== 'GET') {
    return jsonResponse(
      {
        tokenOk: false,
        status: 405,
        itemCount: 0,
        firstTitle: '',
        firstImageUrl: '',
        items: [],
        envDebug,
        error: 'Method not allowed',
        message: 'Use GET /api/ebay?q=turntable%20stylus'
      },
      {
        status: 405,
        cacheControl: 'no-store',
        headers: {
          allow: 'GET'
        }
      }
    );
  }

  try {
    const accessToken = await getAccessToken(env);
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const query = url.searchParams.get('q');

    if (category !== null) {
      const sectionKey = CATEGORY_TO_SECTION[category.toLowerCase()];

      if (!sectionKey) {
        return jsonResponse(
          {
            tokenOk: false,
            status: 400,
            itemCount: 0,
            firstTitle: '',
            firstImageUrl: '',
            items: [],
            envDebug,
            error: 'Invalid category',
            message: 'Use category=pink-floyd, the-beatles, japanese-pressings, colored-vinyl, or new-finds'
          },
          {
            status: 400,
            cacheControl: 'no-store'
          }
        );
      }

      const payload = await searchCategory(accessToken, sectionKey, env);

      return jsonResponse({
        ...payload,
        envDebug
      }, {
        cacheControl: 'public, max-age=900'
      });
    }

    if (query !== null) {
      const payload = await searchBrowseApi(accessToken, query, env);

      return jsonResponse({
        ...payload,
        envDebug
      }, {
        cacheControl: 'public, max-age=900'
      });
    }

    const entries = await Promise.all(
      Object.entries(SECTION_QUERIES).map(async ([key, query]) => {
        const items = await searchItems(accessToken, query, key, env);
        return [key, items];
      })
    );

    return jsonResponse({
      updatedAt: new Date().toISOString(),
      sections: Object.fromEntries(entries)
    });
  } catch (error) {
    return jsonResponse(
      {
        tokenOk: false,
        status: 502,
        itemCount: 0,
        firstTitle: '',
        firstImageUrl: '',
        items: [],
        envDebug,
        error: 'Live eBay feed unavailable',
        message: error.message
      },
      {
        status: 502,
        cacheControl: 'no-store'
      }
    );
  }
}
