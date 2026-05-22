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
  'japanese-vinyl': 'Japan pressing rock metal vinyl LP obi -cd -dvd -book -poster',
  'israeli-vinyl': 'Israeli vinyl record LP Israel Hebrew music -poster -cd -dvd -book -cassette -barbie -doll -toy',
  'limited-edition-vinyl': 'limited edition vinyl record LP colored numbered sealed -doll -toy -barbie -figure -book -cd -dvd',
  posters: 'vintage music poster concert poster Israel Japan rock'
};

const SECTION_LIMIT = 10;
const SEARCH_LIMIT = 50;
const DEFAULT_QUERY = SECTION_QUERIES['limited-edition-vinyl'];
const SECTION_FILTERS = {
  'israeli-vinyl': {
    includeGroups: [
      ['israel', 'israeli', 'hebrew', 'judaica', 'jewish'],
      ['lp', 'vinyl', 'record']
    ],
    exclude: ['poster', 'cd', 'dvd', 'cassette', 'book', 'doll', 'toy', 'barbie']
  },
  'japanese-vinyl': {
    includeGroups: [
      ['japan', 'japanese', 'obi'],
      ['vinyl', 'lp', 'record']
    ],
    exclude: ['cd', 'dvd', 'book', 'poster']
  },
  'limited-edition-vinyl': {
    includeGroups: [
      ['vinyl', 'lp', 'record', 'album']
    ],
    exclude: ['doll', 'toy', 'barbie', 'figure', 'book', 'cd', 'dvd']
  },
  posters: {
    includeGroups: [
      ['poster', 'print', 'concert', 'tour']
    ],
    exclude: []
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
    title: item.title || 'LucyLP Collector Find',
    image: imageUrl,
    imageUrl,
    price,
    condition: item.condition || '',
    url: appendAffiliateParams(item.itemWebUrl)
  };
}

function titleMatchesFilter(item, filter) {
  const title = String(item.title || '').toLowerCase();
  const includesRequiredTerms = filter.includeGroups.every((group) => {
    return group.some((term) => title.includes(term));
  });
  const includesExcludedTerm = filter.exclude.some((term) => title.includes(term));

  return includesRequiredTerms && !includesExcludedTerm;
}

function isVinylQuery(query) {
  const normalizedQuery = String(query || '').toLowerCase();
  return ['vinyl', 'lp', 'record', 'album'].some((term) => normalizedQuery.includes(term));
}

function filterItemsForSection(items, sectionKey) {
  const filter = SECTION_FILTERS[sectionKey];

  if (!filter) {
    return items;
  }

  return items.filter((item) => titleMatchesFilter(item, filter));
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

async function searchItems(accessToken, query, sectionKey) {
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
  return filterItemsForSection(data.itemSummaries || [], sectionKey)
    .slice(0, SECTION_LIMIT)
    .map(normalizeItem);
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
    const query = url.searchParams.get('q');

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
