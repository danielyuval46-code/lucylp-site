const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope';
const MARKETPLACE_ID = 'EBAY_US';

const AFFILIATE_PARAMS = {
  mkcid: '1',
  mkrid: '711-53200-19255-0',
  siteid: '0',
  campid: '5339154057',
  customid: 'LucyLPnew',
  toolid: '10001',
  mkevt: '1'
};

const SECTION_QUERIES = {
  'japanese-vinyl': 'Japanese vinyl LP Japan pressing obi rock metal',
  'israeli-vinyl': 'Israel Israeli Hebrew vinyl LP record music',
  'limited-edition-vinyl': 'limited edition vinyl LP record colored sealed exclusive',
  posters: 'Israel Japan concert poster music poster vintage'
};

const SECTION_LIMIT = 6;
const SEARCH_LIMIT = 50;
const DEFAULT_QUERY = SECTION_QUERIES['limited-edition-vinyl'];
const CATEGORY_TO_SECTION = {
  japanese: 'japanese-vinyl',
  israeli: 'israeli-vinyl',
  limited: 'limited-edition-vinyl',
  posters: 'posters'
};
const VINYL_INCLUDE_GROUPS = [
  ['vinyl', 'lp', 'record', 'album']
];
const VINYL_EXCLUDE_TERMS = [
  'funko',
  'doll',
  'toy',
  'figure',
  'barbie',
  'plush',
  'outfit',
  'head',
  'body',
  'statue',
  'collectible figure',
  'book',
  'cd',
  'dvd',
  'cassette',
  'poster'
];
const LIMITED_EXCLUDE_TERMS = [
  'funko',
  'doll',
  'toy',
  'figure',
  'barbie',
  'plush',
  'christmas',
  'holiday',
  'kids'
];
const NON_MEDIA_EXCLUDE_TERMS = [
  'funko',
  'doll',
  'toy',
  'figure',
  'barbie',
  'plush',
  'outfit',
  'head',
  'body',
  'statue',
  'collectible figure',
  'book',
  'cd',
  'dvd',
  'cassette'
];
const SECTION_FILTERS = {
  'israeli-vinyl': {
    includeGroups: [
      ['israel', 'israeli', 'hebrew', 'jewish', 'judaica'],
      ...VINYL_INCLUDE_GROUPS
    ],
    exclude: VINYL_EXCLUDE_TERMS
  },
  'japanese-vinyl': {
    includeGroups: [
      ['japan', 'japanese', 'obi', 'pressing'],
      ...VINYL_INCLUDE_GROUPS
    ],
    exclude: VINYL_EXCLUDE_TERMS
  },
  'limited-edition-vinyl': {
    includeGroups: [
      ['vinyl', 'lp', 'record', 'album'],
      ['limited', 'exclusive', 'colored', 'colour', 'marble', 'swirl', 'splatter', 'sealed', 'rsd']
    ],
    exclude: LIMITED_EXCLUDE_TERMS,
    excludeUnlessVinyl: ['soundtrack']
  },
  posters: {
    includeGroups: [
      ['poster', 'print', 'concert', 'tour']
    ],
    exclude: NON_MEDIA_EXCLUDE_TERMS
  }
};

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
    const url = new URL(itemUrl);

    Object.entries(AFFILIATE_PARAMS).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  } catch (_error) {
    return itemUrl;
  }
}

function normalizeItem(item) {
  const price = item.price
    ? `${item.price.currency || 'USD'} ${item.price.value}`
    : '';
  const imageUrl =
    item.image?.imageUrl ||
    item.thumbnailImages?.[0]?.imageUrl ||
    '/vinyl-placeholder.jpg';

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
  return Boolean(imageUrl) && !imageUrl.includes('placeholder');
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

function filterItemsForSection(items, sectionKey) {
  const filter = SECTION_FILTERS[sectionKey];

  if (!filter) {
    return removeDuplicateItems(items.filter(hasRealImage));
  }

  return removeDuplicateItems(
    items
      .filter(hasRealImage)
      .filter((item) => titleMatchesFilter(item, filter))
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
    items: itemSummaries.slice(0, SECTION_LIMIT).map(normalizeItem)
  };
}

function buildCategoryPayload(response, sectionKey, items, debugCounts) {
  const firstItem = items[0] || {};

  return {
    tokenOk: true,
    status: response.status,
    category: sectionKey,
    categoryQueryUsed: SECTION_QUERIES[sectionKey],
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
    hasEbayClientSecret: Boolean(env.EBAY_CLIENT_SECRET)
  };
}

async function getAccessToken(env) {
  if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET) {
    throw new Error('Missing eBay API credentials');
  }

  const credentials = btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`);
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

async function fetchBrowseSummaries(accessToken, query) {
  const url = new URL(EBAY_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(SEARCH_LIMIT));
  url.searchParams.set('sort', 'newlyListed');

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-ebay-c-marketplace-id': MARKETPLACE_ID
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

async function searchItems(accessToken, query, sectionKey) {
  const { itemSummaries } = await fetchBrowseSummaries(accessToken, query);

  return filterItemsForSection(itemSummaries, sectionKey)
    .slice(0, SECTION_LIMIT)
    .map(normalizeItem);
}

async function searchCategory(accessToken, sectionKey) {
  const { response, itemSummaries } = await fetchBrowseSummaries(
    accessToken,
    SECTION_QUERIES[sectionKey]
  );
  const filteredItems = filterItemsForSection(itemSummaries, sectionKey);
  const items = filteredItems.slice(0, SECTION_LIMIT).map(normalizeItem);

  return buildCategoryPayload(response, sectionKey, items, {
    rawCountBeforeFiltering: itemSummaries.length,
    filteredCountAfterFiltering: filteredItems.length
  });
}

async function searchBrowseApi(accessToken, query) {
  const url = new URL(EBAY_SEARCH_URL);
  url.searchParams.set('q', query || DEFAULT_QUERY);
  url.searchParams.set('limit', String(SEARCH_LIMIT));
  url.searchParams.set('sort', 'newlyListed');

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-ebay-c-marketplace-id': MARKETPLACE_ID
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`eBay Browse search failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  const itemSummaries = isVinylQuery(query)
    ? filterItemsForSection(data.itemSummaries || [], 'limited-edition-vinyl')
    : data.itemSummaries || [];

  return buildDiagnosticPayload(response, {
    ...data,
    itemSummaries
  });
}

export async function onRequest(context) {
  const { env, request } = context;
  const envDebug = getEnvDebug(env);

  console.log('LucyLP eBay env availability', envDebug);

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
        message: 'Use GET /api/ebay?q=vinyl%20limited%20edition'
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
            message: 'Use category=limited, israeli, japanese, or posters'
          },
          {
            status: 400,
            cacheControl: 'no-store'
          }
        );
      }

      const payload = await searchCategory(accessToken, sectionKey);

      return jsonResponse({
        ...payload,
        envDebug
      }, {
        cacheControl: 'no-store'
      });
    }

    if (query !== null) {
      const payload = await searchBrowseApi(accessToken, query);

      return jsonResponse({
        ...payload,
        envDebug
      }, {
        cacheControl: 'no-store'
      });
    }

    const entries = await Promise.all(
      Object.entries(SECTION_QUERIES).map(async ([key, query]) => {
        const items = await searchItems(accessToken, query, key);
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
